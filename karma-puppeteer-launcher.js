const puppeteer = require('puppeteer');

process.env.CHROME_BIN = puppeteer.executablePath();

console.log('Using Puppeteer Chrome at:', process.env.CHROME_BIN);
