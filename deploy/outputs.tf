output "hub_url" {
  description = "Hub Cloud Run service URL"
  value       = google_cloud_run_v2_service.hub.uri
}

output "hub_mcp_url" {
  description = "Hub MCP endpoint (for plugin config)"
  value       = local.hub_mcp_url
}

output "architect_url" {
  description = "Architect Cloud Run service URL"
  value       = google_cloud_run_v2_service.architect.uri
}

output "state_bucket" {
  description = "GCS bucket for system state"
  value       = google_storage_bucket.state.name
}

output "registry_prefix" {
  description = "Artifact Registry image prefix"
  value       = local.registry_prefix
}

output "runtime_service_account" {
  description = "Runtime service account email"
  value       = google_service_account.runtime.email
}
