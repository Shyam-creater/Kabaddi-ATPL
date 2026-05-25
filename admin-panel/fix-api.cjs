const fs = require('fs');
const files = ['src/services/productApi.js', 'src/services/categoryApi.js', 'src/services/variantApi.js'];
const replacement = `const checkAdminAccess = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Unauthorized access. Please login as admin.');
  }
};`;

files.forEach(file => {
  if(fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/const checkAdminAccess = \(\) => \{[\s\S]*?\n\};/, replacement);
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
