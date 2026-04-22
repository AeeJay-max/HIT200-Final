const mongoose = require('mongoose');

async function patch() {
    await mongoose.connect('mongodb+srv://ainosmakura:TatendaAinos2005$@cluster0.dv9g0pa.mongodb.net/citypulse?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");

    const AdminModel = mongoose.connection.collection('admins');

    const user = await AdminModel.findOne({ email: "tatendaajmakura@gmail.com" });
    if (!user) {
        console.log("User not found!");
    } else {
        console.log("Existing user:", user);
        await AdminModel.updateOne({ _id: user._id }, {
            $set: { role: "MAIN_ADMIN" },
            $unset: { department: "" }
        });
        console.log("Updated to MAIN_ADMIN and removed department string.");
    }

    process.exit(0);
}

patch().catch(console.error);
