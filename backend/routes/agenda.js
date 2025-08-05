// agenda.js
import Agenda from "agenda";

const username = 'adminbhaskar';
const password = 'NJMWttEUet3IL6KE';

var dbUrl = 'mongodb+srv://'+username+':'+password+'@atlascluster.kz10ypn.mongodb.net/?retryWrites=true&w=majority&appName=AtlasCluster';

const agenda = new Agenda({
  db: {
    address: dbUrl, // ✅ Your MongoDB connection string
    collection: "agenda_jobs",      // Collection where jobs will be stored
  },
  processEvery: "30 seconds", // How often it checks for due jobs
});

export default agenda;
