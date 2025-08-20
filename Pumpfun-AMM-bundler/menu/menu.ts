import readline from "readline"
import fs from 'fs'
import { sleep } from "../src/utils";

export const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

export const screen_clear = () => {
    console.clear();
}

export const main_menu_display = () => {
    console.log('\t[1] - Create Token');
    console.log('\t[12] - Exit');
}

export const security_checks_display = () => {
    console.log('\t[5] - Exit');
}