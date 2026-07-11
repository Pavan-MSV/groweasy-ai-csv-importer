import { localMapRecordsBatch } from './services/localMapperService';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const results: any[] = [];
const csvPath = path.join(__dirname, '../../test_leads.csv');

console.log('Reading test CSV from:', csvPath);

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (data: any) => results.push(data))
  .on('end', () => {
    console.log('Parsed Raw Rows from CSV:');
    console.log(results);
    
    console.log('\nProcessing through Local Mapper:');
    const mapped = localMapRecordsBatch(results);
    console.log('Mapped Results:');
    console.log(JSON.stringify(mapped, null, 2));
  });
