
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const AdminSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    role: String,
    department: String
}, { strict: false });

const WorkerSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    role: String,
    department: String
}, { strict: false });

const Admin = mongoose.model('Admin', AdminSchema);
const Worker = mongoose.model('Worker', WorkerSchema);

async function check() {
    try {
        console.log("Connecting to:", process.env.DATABASE_URL);
        await mongoose.connect(process.env.DATABASE_URL);

        const admins = await Admin.find({});
        console.log("ADMINS IN DB:", admins.length);
        admins.forEach(a => console.log(`- ${a.fullName} (${a.email}) | Role: ${a.role} | Dept: ${a.department}`));

        const workers = await Worker.find({});
        console.log("\nWORKERS IN DB:", workers.length);
        workers.forEach(w => console.log(`- ${w.fullName} (${w.email}) | Role: ${w.role} | Dept: ${w.department}`));

        // Migration: Ensure tatendaajmakura@gmail.com is MAIN_ADMIN
        const target = await Admin.findOne({ email: 'tatendaajmakura@gmail.com' });
        if (target && target.role !== 'MAIN_ADMIN') {
            console.log(`\nUPGRADING ${target.email} to MAIN_ADMIN...`);
            target.role = 'MAIN_ADMIN';
            target.department = 'Main';
            await target.save();
            console.log("Upgrade complete.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
