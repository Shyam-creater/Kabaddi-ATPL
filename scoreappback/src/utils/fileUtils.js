const fs = require('fs');
const path = require('path');

exports.deleteFiles = (filePaths) => {
    if (!filePaths || !Array.isArray(filePaths)) return;
    filePaths.forEach(filePath => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    });
};

exports.getFullPath = (filename) => {
    return path.join(__dirname, '..', '..', 'public', 'uploads', filename);
};
