const fs = require('fs');
const file = 'src/pages/Stores.tsx';
let content = fs.readFileSync(file, 'utf8');
if (!content.includes('import { brandApi }')) {
  content = content.replace('import { variantApi } from "../services/variantApi";', 'import { variantApi } from "../services/variantApi";\nimport { brandApi } from "../services/brandApi";');
  fs.writeFileSync(file, content);
  console.log('Added brandApi import');
}
