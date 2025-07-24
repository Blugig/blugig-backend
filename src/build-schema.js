const fs = require('fs');
const path = require('path');

const schemaDir = path.join(__dirname, '../prisma');
const outputFile = path.join(schemaDir, 'schema.prisma');

// Base configuration
const baseConfig = `
generator client {
    provider = "prisma-client-js"
    previewFeatures = ["driverAdapters"]
}

datasource db {
    provider = "sqlite"
    url      = "file:./dev.db"
}

`;

try {
  // Read all .prisma files from models directory
  const modelsDir = path.join(schemaDir, 'models');

  if (!fs.existsSync(modelsDir)) {
    console.error('❌ Models directory not found:', modelsDir);
    process.exit(1);
  }

  const modelFiles = fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('.prisma'))
    .sort();

  let schemaContent = baseConfig;

  // Concatenate all model files
  modelFiles.forEach(file => {
    const filePath = path.join(modelsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    schemaContent += `\n// From ${file}\n${content}\n`;
  });

  // Write the combined schema
  fs.writeFileSync(outputFile, schemaContent);

  console.log('✅ Schema built successfully!');
  console.log(`📁 Output: ${outputFile}`);
  console.log(`📝 Combined ${modelFiles.length} model files`);

} catch (error) {
  console.error('❌ Build schema error:', error);
  process.exit(1);
}