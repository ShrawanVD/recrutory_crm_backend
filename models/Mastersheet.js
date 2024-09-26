import mongoose from 'mongoose';
const { Schema } = mongoose;

const LanguageSchema = new mongoose.Schema({
  lType: String,
  lang: String,
  proficiencyLevel: String
});


const MasterSheetSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  date: { type: Date, default: Date.now }, // created at date
  status: { type: String, default: null },
  assignProcess: { type: String, default: null },
  isProcessAssigned: { type: Boolean, default: false },
  interested: { type: String, default: null },
  assignedRecruiter: { type: String, default: null },
  language: [LanguageSchema],
  jbStatus: { type: String },
  qualification: { type: String },
  industry: { type: String },
  domain: { type: String },
  exp: { type: String },
  cLocation: { type: String },
  pLocation: { type: String },
  currentCTC: { type: Number },
  expectedCTC: { type: Number },
  noticePeriod: { type: String },
  wfh: { type: String },
  resumeLink: { type: String },
  linkedinLink: { type: String },
  feedback: { type: String },
  remark: { type: String },
  company: { type: String },
  voiceNonVoice: { type: String },
  source: { type: String },
  createdBy: { type: String },
  lastUpdatedBy: { type: String },
  createdById: { type: Schema.Types.ObjectId},
  lastUpdatedById: { type: Schema.Types.ObjectId},


  lastUpdateDate: {type: Date, default: null},
  taskDate: {type: Date, default: Date.now},
  regId: {type: String, default: null},
  aadhar: {type: String, default: null},
  empId:  {type: String, default: null},
  dob: {type: Date, default: null},
  father: {type: String, default: null},

  regStatus: {type: String},
  iaScore: {type: Number, default: null},
  
});

const Mastersheet = mongoose.model('Mastersheet', MasterSheetSchema);

export default Mastersheet;

