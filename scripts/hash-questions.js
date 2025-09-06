import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalize(input) {
  let result = input;
  result = result.normalize('NFKC');
  result = result.trim();
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/[。、！？\u3000]/g, '');
  result = result.toLowerCase();
  result = result.replace(/[ァ-ヾ]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
  return result;
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function processQuestions(inputFile, outputFile) {
  const inputPath = path.resolve(__dirname, '..', inputFile);
  const outputPath = path.resolve(__dirname, '..', outputFile);
  
  console.log(`Processing ${inputPath} -> ${outputPath}`);
  
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    return;
  }
  
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const questions = JSON.parse(rawData);
  
  const hashedQuestions = questions.map(question => {
    if (question.acceptedAnswers && Array.isArray(question.acceptedAnswers)) {
      const acceptedHash = question.acceptedAnswers.map(answer => {
        const normalized = normalize(answer);
        const hash = sha256Hex(normalized);
        console.log(`  "${answer}" -> "${normalized}" -> ${hash}`);
        return hash;
      });
      
      const { acceptedAnswers, ...questionWithoutAnswers } = question;
      return {
        ...questionWithoutAnswers,
        acceptedHash
      };
    }
    return question;
  });
  
  // 出力ディレクトリが存在しない場合は作成
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(hashedQuestions, null, 2));
  console.log(`✅ Processed ${questions.length} questions`);
}

// メイン処理
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node hash-questions.js <input-file> <output-file>');
  process.exit(1);
}

const [inputFile, outputFile] = args;
processQuestions(inputFile, outputFile);