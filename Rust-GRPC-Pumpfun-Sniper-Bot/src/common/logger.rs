use chrono::Local;
use colored::*;

const LOG_LEVEL: &str = "LOG";

#[derive(Clone)]
pub struct Logger {
    prefix: String,
    date_format: String,
}

struct LogLevel<'a> {
    level: &'a str,
}
impl LogLevel<'_> {
    fn new() -> Self {
        let level = LOG_LEVEL;
        LogLevel { level }
    }
    fn is_debug(&self) -> bool {
        self.level.to_lowercase().eq("debug")
    }
}
