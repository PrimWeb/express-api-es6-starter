"use strict";

import logger from './logger';
const tsvURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQH2bwzCil6XXWq0qN9ng0jhSgBsFgOTNeeFUPpsM4bd0VjtqreujdavU4HNDwGkrBNU-5wHrY_PAX9/pub?gid=1442207499&single=true&output=tsv";
const tsvJSON = (tsv) => {
    const lines = tsv.split("\r\n"),
      result = [],
      headers = lines[0].split("\t");
    for (let i = 1; i < lines.length; i++) {
      const obj = {},
        currentline = lines[i].split("\t");
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j].trim()] = currentline[j];
      }
      result.push(obj);
    }
    return result; //JSON
  },
  getData = async (url) => {
    /* dataLoader.style.display = "block"; */
    return await fetch(url)
        .then(
          async (response) => {
            return await response.text();
          },
          (err) => {
            logger.error("TSV Fetch problem: " + err.message, err);
            return "{}";
          }
        )
      .then(async tsv => tsvJSON(await tsv));
  },
  getProducts = async () => {
    const ret = getData(tsvURL).then(r => {
        return r;
    });
    return await ret;
  };

export default getProducts;
