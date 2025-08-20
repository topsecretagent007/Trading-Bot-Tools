use std::fs;
use std::io::{self, BufRead};

#[derive(Clone)]
pub struct Targetlist {
    addresses: Vec<String>,
}

impl Targetlist {

    // Check if an address is in the Targetlist
    pub fn is_listed_on_target(&self, address: &str) -> bool {
        self.addresses.contains(&address.to_string())
    }
}
