//! Static asset handling with caching support.

use mime_guess::from_path;
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::hash::{Hash, Hasher, DefaultHasher};

/// Embedded web assets
#[derive(rust_embed::Embed)]
#[folder = "web/dist"]
#[include = "**/*"]
pub struct WebAssets;

/// Metadata for cached assets including MIME type and hash
#[derive(Clone)]
pub struct AssetMetadata {
    pub mime_type: Option<String>,
    pub hash: AssetHash,
}

impl AssetMetadata {
    /// Check if the provided ETag matches this asset's hash
    pub fn etag_matches(&self, etag: &str) -> bool {
        etag == self.hash.quoted()
    }
}

/// Hash representation for asset content
#[derive(Clone, Copy)]
pub struct AssetHash(u64);

impl AssetHash {
    /// Get the hash as a quoted string for use in ETag headers
    pub fn quoted(&self) -> String {
        format!("\"{}\"", self.0)
    }
}

/// Global cache for asset metadata
static ASSET_METADATA_CACHE: Lazy<HashMap<String, AssetMetadata>> = Lazy::new(HashMap::new);

/// Get asset metadata with caching
pub fn get_asset_metadata_cached(path: &str, data: &[u8]) -> AssetMetadata {
    // Check cache first
    if let Some(metadata) = ASSET_METADATA_CACHE.get(path) {
        return metadata.clone();
    }

    // Compute metadata if not cached
    let mime_type = from_path(path).first().map(|m| m.to_string());

    // Compute hash of the asset content
    let mut hasher = DefaultHasher::new();
    data.hash(&mut hasher);
    let hash = AssetHash(hasher.finish());

    AssetMetadata { mime_type, hash }
}
