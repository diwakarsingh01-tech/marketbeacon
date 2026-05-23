import { fetchScreenerData } from './screener.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugRatios(symbol: string) {
  const url = `https://www.screener.in/company/${symbol}/consolidated/`;
  const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
  });
  const $ = cheerio.load(data);
  console.log(`--- Ratios for ${symbol} ---`);
  $(`#top-ratios li`).each((i, el) => {
    const name = $(el).find('.name').text().trim();
    const val = $(el).find('.value').text().trim();
    console.log(`${name}: ${val}`);
  });
}

async function test() {
  await debugRatios('TCS');
}

test();
