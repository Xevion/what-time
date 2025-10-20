//! Configuration module for the when-works application.
//!
//! This module handles loading and parsing configuration from environment variables
//! using the figment crate.

use fundu::{DurationParser, TimeUnit};
use serde::{Deserialize, Deserializer};
use std::time::Duration;

/// Main application configuration
#[derive(Deserialize)]
pub struct Config {
    /// Log level for the application
    ///
    /// Valid values are: "trace", "debug", "info", "warn", "error"
    /// Defaults to "info" if not specified
    #[serde(default = "default_log_level")]
    pub log_level: String,

    /// Port for the web server (default: 8080)
    #[serde(default = "default_port")]
    pub port: u16,

    /// Database connection URL
    pub database_url: String,

    /// Graceful shutdown timeout duration
    ///
    /// Accepts both numeric values (seconds) and duration strings
    /// Defaults to 8 seconds if not specified
    #[serde(
        default = "default_shutdown_timeout",
        deserialize_with = "deserialize_duration"
    )]
    pub shutdown_timeout: Duration,

    /// Secret key for session encryption
    pub session_secret: String,
}

/// Default log level of "info"
fn default_log_level() -> String {
    "info".to_string()
}

/// Default port of 8080
fn default_port() -> u16 {
    8080
}

/// Default shutdown timeout of 8 seconds
fn default_shutdown_timeout() -> Duration {
    Duration::from_secs(8)
}

/// Duration parser configured to handle various time units with seconds as default
const DURATION_PARSER: DurationParser<'static> = DurationParser::builder()
    .time_units(&[TimeUnit::Second, TimeUnit::MilliSecond, TimeUnit::Minute])
    .parse_multiple(None)
    .allow_time_unit_delimiter()
    .disable_infinity()
    .disable_fraction()
    .disable_exponent()
    .default_unit(TimeUnit::Second)
    .build();

/// Custom deserializer for duration fields that accepts both numeric and string values
fn deserialize_duration<'de, D>(deserializer: D) -> Result<Duration, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::Visitor;

    struct DurationVisitor;

    impl<'de> Visitor<'de> for DurationVisitor {
        type Value = Duration;

        fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
            formatter.write_str("a duration string or number")
        }

        fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            DURATION_PARSER.parse(value)
                .map_err(|e| {
                    serde::de::Error::custom(format!(
                        "Invalid duration format '{}': {}. Examples: '5' (5 seconds), '3500ms', '30s', '2m'",
                        value, e
                    ))
                })?
                .try_into()
                .map_err(|e| serde::de::Error::custom(format!("Duration conversion error: {}", e)))
        }

        fn visit_u64<E>(self, value: u64) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            Ok(Duration::from_secs(value))
        }

        fn visit_i64<E>(self, value: i64) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            if value < 0 {
                return Err(serde::de::Error::custom("Duration cannot be negative"));
            }
            Ok(Duration::from_secs(value as u64))
        }
    }

    deserializer.deserialize_any(DurationVisitor)
}
