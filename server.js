const app = require('./app');  // אם הקוד שהצגת שמור ב-app.js
const PORT = process.env.PORT || 3033;

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
