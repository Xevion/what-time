use figment::{
    providers::{Env, Format, Toml},
    Figment,
};
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use std::process::ExitCode;
use tokio::net::TcpListener;
use tracing::{error, info};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod web;

use config::Config;
use web::{create_router, AppState};

#[tokio::main]
async fn main() -> ExitCode {
    // Load environment variables from .env file
    dotenvy::dotenv().ok();

    // Load configuration
    let config: Config = match Figment::new()
        .merge(Toml::file("config.toml"))
        .merge(Env::prefixed(""))
        .extract()
    {
        Ok(config) => config,
        Err(e) => {
            eprintln!("Failed to load configuration: {}", e);
            return ExitCode::FAILURE;
        }
    };

    // Setup logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                format!(
                    "{}={}",
                    env!("CARGO_PKG_NAME").replace('-', "_"),
                    config.log_level
                )
                .into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!(
        version = env!("CARGO_PKG_VERSION"),
        commit = env!("GIT_COMMIT_SHORT"),
        "starting when-works"
    );

    // Connect to database
    let db = match PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await
    {
        Ok(pool) => {
            info!("connected to database");
            pool
        }
        Err(e) => {
            error!("failed to connect to database: {}", e);
            return ExitCode::FAILURE;
        }
    };

    // Run migrations
    if let Err(e) = sqlx::migrate!().run(&db).await {
        error!("failed to run migrations: {}", e);
        return ExitCode::FAILURE;
    }
    info!("database migrations applied");

    // Create application state
    let state = AppState { db };

    // Create router
    let app = create_router(state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    info!(
        link = format!("http://localhost:{}", addr.port()),
        "starting web server"
    );

    let listener = match TcpListener::bind(addr).await {
        Ok(listener) => listener,
        Err(e) => {
            error!("failed to bind to {}: {}", addr, e);
            return ExitCode::FAILURE;
        }
    };

    if let Err(e) = axum::serve(listener, app).await {
        error!("server error: {}", e);
        return ExitCode::FAILURE;
    }

    info!("server stopped");
    ExitCode::SUCCESS
}
