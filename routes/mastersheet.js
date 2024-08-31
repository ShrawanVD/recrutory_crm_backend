import express from "express";
import "dotenv/config.js";
import Mastersheet from "../models/Mastersheet.js";
import ClientSheet from "../models/Client.js";
// const jwt = require('jsonwebtoken');
import jwt from "jsonwebtoken"
const secretKey = "secretKey";


const router = express.Router();




// Candidate update route -> dosent have assign process logic so kept it for future ref.
// router.put("/candidates/:id", verifyToken, async (req, res) => {
//   jwt.verify(req.token, secretKey, async (err, authData) => {
//     if (err) {
//       return res.status(403).json({ message: "Forbidden: Invalid token" });
//     }

//     const lastUpdatedBy = authData.username;

//     try {
//       const candidate = await Mastersheet.findById(req.params.id);
//       if (!candidate) {
//         return res.status(404).json({ message: "Candidate not found" });
//       }

//       // retain the created by value
//       const createdBy = candidate.createdBy;

//       const normalizePhone = (phone) => {
//         if (typeof phone !== 'string' && typeof phone !== 'number') return '';

//         let normalizedPhone = typeof phone === 'number' ? String(phone) : phone;
//         normalizedPhone = normalizedPhone.trim().replace(/[\s\-]/g, '');

//         const hasCountryCode = normalizedPhone.match(/^(\+?\d{1,3})\s?\d+/);
//         if (hasCountryCode) {
//           const countryCode = hasCountryCode[1].replace(/^\+/, '');
//           return `${countryCode}${normalizedPhone.slice(hasCountryCode[1].length)}`;
//         }
//         return normalizedPhone;
//       };

//       const normalizeEmail = (email) => (typeof email === 'string' ? email.toLowerCase().trim() : email);

//       const normalizedPhone = normalizePhone(req.body.phone);
//       const existingCandidate = await Mastersheet.findOne({
//         phone: normalizedPhone,
//         _id: { $ne: req.params.id },
//       });

//       if (existingCandidate) {
//         return res.status(400).json({ message: "Candidate with this phone number already exists." });
//       }

//       // Update candidate details
//       Object.assign(candidate, {
//         ...req.body,
//         phone: normalizedPhone,
//         email: normalizeEmail(req.body.email),
//         createdBy,
//         lastUpdatedBy,
//       });

//       await candidate.save();
//       res.status(200).json({ message: "Candidate updated successfully", candidate });
//     } catch (err) {
//       console.error("Error updating the Candidate:", err);
//       res.status(500).json({ message: err.message });
//     }
//   });
// });




// // Create a new candidate
// router.post("/candidates", async (req, res) => {
//   try {
//     // Normalize phone number (trim spaces, handle country codes, remove internal spaces/dashes)
//     const normalizePhone = (phone) => {
//       if (typeof phone !== 'string' && typeof phone !== 'number') return '';

//       let normalizedPhone = typeof phone === 'number' ? String(phone) : phone;

//       // Trim leading and trailing spaces
//       normalizedPhone = normalizedPhone.trim();

//       // Detect and handle the presence of country codes (with or without a '+')
//       const hasCountryCode = normalizedPhone.match(/^(\+?\d{1,3})\s?\d+/);

//       // Remove internal spaces and dashes
//       normalizedPhone = normalizedPhone.replace(/[\s\-]/g, '');

//       // If a country code is detected, keep it intact
//       if (hasCountryCode) {
//         const countryCode = hasCountryCode[1].replace(/^\+/, ''); // Remove any leading +
//         return `${countryCode}${normalizedPhone.slice(hasCountryCode[1].length)}`;
//       }

//       // Return the normalized phone number without adding a country code
//       return normalizedPhone;
//     };

//     const normalizeEmail = (email) => typeof email === 'string' ? email.toLowerCase().trim() : email;

//     // Normalize the phone number before checking for duplicates
//     const phone = normalizePhone(req.body.phone);

//     // Check if a candidate with the same normalized phone number already exists
//     const existingCandidate = await Mastersheet.findOne({ phone });

//     if (existingCandidate) {
//       return res
//         .status(400)
//         .json({ message: "Candidate with this phone number already exists." });
//     }

//     // Create a new candidate if no duplicates are found
//     const candidate = new Mastersheet({
//       name: req.body.name,
//       email: normalizeEmail(req.body.email),
//       phone: phone,
//       status: req.body.status || null,
//       assignProcess: req.body.assignProcess || null,
//       interested: req.body.interested || null,
//       assignedRecruiter: req.body.assignedRecruiter || null,
//       language: req.body.language,
//       jbStatus: req.body.jbStatus,
//       qualification: req.body.qualification,
//       industry: req.body.industry,
//       domain: req.body.domain,
//       exp: req.body.exp,
//       cLocation: req.body.cLocation,
//       pLocation: req.body.pLocation,
//       currentCTC: req.body.currentCTC,
//       expectedCTC: req.body.expectedCTC,
//       noticePeriod: req.body.noticePeriod,
//       wfh: req.body.wfh,
//       resumeLink: req.body.resumeLink,
//       linkedinLink: req.body.linkedinLink,
//       feedback: req.body.feedback,
//       remark: req.body.remark,
//       company: req.body.company,
//       voiceNonVoice: req.body.voiceNonVoice,
//       source: req.body.source,
//       createdBy: createdBy,
//     });

//     const newCandidate = await candidate.save();
//     console.log("New Candidate is: " + newCandidate);
//     res.status(201).json(newCandidate);
//   } catch (err) {
//     console.error("Error saving the Candidate:", err);
//     res
//       .status(500)
//       .json({ message: "Failed to create candidate", error: err.message });
//   }
// });




// checking api


router.get("/", (req, res) => {
  res.status(200).send({
    msg: "Mastersheet's APIs are working successfully",
  });
});

// Middleware for verifying the token
function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    req.token = token;
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Invalid login" });
  }
}

// Candidate creation route
router.post("/candidates", verifyToken, async (req, res) => {
  jwt.verify(req.token, secretKey, async (err, authData) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden: Invalid token" });
    }

    const createdBy = authData.username;
    console.log("created by in the candidate create function is: " + createdBy);

    try {
      // Normalize phone number (trim spaces, handle country codes, remove internal spaces/dashes)
      const normalizePhone = (phone) => {
        if (typeof phone !== 'string' && typeof phone !== 'number') return '';

        let normalizedPhone = typeof phone === 'number' ? String(phone) : phone;
        normalizedPhone = normalizedPhone.trim().replace(/[\s\-]/g, '');

        const hasCountryCode = normalizedPhone.match(/^(\+?\d{1,3})\s?\d+/);
        if (hasCountryCode) {
          const countryCode = hasCountryCode[1].replace(/^\+/, '');
          return `${countryCode}${normalizedPhone.slice(hasCountryCode[1].length)}`;
        }
        return normalizedPhone;
      };

      const normalizeEmail = (email) => (typeof email === 'string' ? email.toLowerCase().trim() : email);

      const phone = normalizePhone(req.body.phone);
      const existingCandidate = await Mastersheet.findOne({ phone });

      if (existingCandidate) {
        return res.status(400).json({ message: "Candidate with this phone number already exists." });
      }

      const candidate = new Mastersheet({
        ...req.body,
        phone,
        email: normalizeEmail(req.body.email),
        createdBy,
      });

      const newCandidate = await candidate.save();
      res.status(201).json(newCandidate);
    } catch (err) {
      console.error("Error saving the Candidate:", err);
      res.status(500).json({ message: "Failed to create candidate", error: err.message });
    }
  });
});


// router.post("/candidates", async (req, res) => {
//   try {
//     const candidate = new Mastersheet({
//       name: req.body.name,
//       email: req.body.email,
//       phone: req.body.phone,
//       status: req.body.status || null,
//       assignProcess: req.body.assignProcess || null,
//       interested: req.body.interested || null,
//       assignedRecruiter: req.body.assignedRecruiter || null,
//       language: req.body.language,
//       jbStatus: req.body.jbStatus,
//       qualification: req.body.qualification,
//       industry: req.body.industry,
//       domain: req.body.domain,
//       exp: req.body.exp,
//       cLocation: req.body.cLocation,
//       pLocation: req.body.pLocation,
//       currentCTC: req.body.currentCTC,
//       expectedCTC: req.body.expectedCTC,
//       noticePeriod: req.body.noticePeriod,
//       wfh: req.body.wfh,
//       resumeLink: req.body.resumeLink,
//       linkedinLink: req.body.linkedinLink,
//       feedback: req.body.feedback,
//       remark: req.body.remark,
//       company: req.body.company,
//       voiceNonVoice: req.body.voiceNonVoice,
//       source: req.body.source,
//     });

//     const newCandidate = await candidate.save();
//     console.log("New Candidate is: " + newCandidate);
//     res.status(201).json(newCandidate);
//   } catch (err) {
//     console.error("Error saving the Candidate:", err);
//     res
//       .status(500)
//       .json({ message: "Failed to create candidate", error: err.message });
//   }
// });

// GET all candidates
router.get("/candidates", async (req, res) => {
  try {
    // Sort candidates by the 'createdAt' field in descending order
    // const candidates = await Mastersheet.find().sort({ createdAt: -1 });

    // If you don’t have a 'createdAt' field, you can sort by '_id'
    const candidates = await Mastersheet.find().sort({ _id: -1 });

    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET candidate by id
router.get("/candidates/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const candidate = await Mastersheet.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: "candidate not found" });
    }
    res.status(200).json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET candidate after filtering the language
router.get("/langfilter", async (req, res) => {
  try {
    const { lang, proficiencyLevel } = req.query;

    // Construct the filter for $elemMatch
    let filter = {};

    if (lang || proficiencyLevel) {
      filter.language = { $elemMatch: {} };

      if (lang) {
        filter.language.$elemMatch.lang = lang;
      }

      if (proficiencyLevel) {
        const proficiencyLevels = proficiencyLevel.split(","); // Split the comma-separated proficiency levels
        filter.language.$elemMatch.proficiencyLevel = {
          $in: proficiencyLevels,
        };
      }
    }

    // Log the constructed filter for debugging
    console.log("Constructed filter:", filter);

    // Perform the query with the constructed filter
    const candidates = await Mastersheet.find(filter);
    res.json(candidates);
  } catch (err) {
    console.error("Error filtering candidates:", err);
    res
      .status(500)
      .json({ message: "Failed to filter candidates", error: err.message });
  }
});

// DELETE candidate by id
router.delete("/candidates/:id", async (req, res) => {
  try {
    const candidateId = req.params.id;
    const candidate = await Mastersheet.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Fetch all clients
    const clients = await ClientSheet.find();

    // Iterate through clients and their processes to remove candidate from interestedCandidates[]
    for (const client of clients) {
      let isModified = false;
      for (const process of client.clientProcess) {
        // Remove the candidate from interestedCandidates[] if present
        const initialLength = process.interestedCandidates.length;
        process.interestedCandidates = process.interestedCandidates.filter(
          (intCand) => String(intCand.candidateId) !== candidateId
        );
        if (process.interestedCandidates.length !== initialLength) {
          isModified = true;
          console.log(
            `Removed candidate ${candidateId} from process ${process.clientProcessName}`
          );
        }
      }
      if (isModified) {
        await client.save(); // Save changes only if there was a removal
      }
    }

    // Delete the candidate from the MasterSheet
    await candidate.deleteOne();

    res.json({
      message:
        "Candidate deleted successfully along with all its copies in the processes",
    });
    console.log("Delete candidate and its copies from processes");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT and shifting candidate to the intCandidate[] of the process from the edit button at the end
// PUT and shifting candidate to the intCandidate[] of the process from the edit button at the end
router.put("/candidates/:id", verifyToken, async (req, res) => {
  jwt.verify(req.token, secretKey, async (err, authData) => {

    if(err){
      return res.status(403).json({message:"Forbidden: Invalid Token"});
    }
    const lastUpdatedBy = authData.username;

    try {
      const candidate = await Mastersheet.findById(req.params.id);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
  
      // retain the created by field
      const createdBy = candidate.createdBy;
  
      // Normalize phone number
      const normalizePhone = (phone) => {
        if (typeof phone !== 'string' && typeof phone !== 'number') return '';
  
        let normalizedPhone = typeof phone === 'number' ? String(phone) : phone;
  
        // Trim leading and trailing spaces
        normalizedPhone = normalizedPhone.trim();
  
        // Detect and handle the presence of country codes (with or without a '+')
        const hasCountryCode = normalizedPhone.match(/^(\+?\d{1,3})\s?\d+/);
  
        // Remove internal spaces and dashes
        normalizedPhone = normalizedPhone.replace(/[\s\-]/g, '');
  
        // If a country code is detected, keep it intact
        if (hasCountryCode) {
          const countryCode = hasCountryCode[1].replace(/^\+/, ''); // Remove any leading +
          return `${countryCode}${normalizedPhone.slice(hasCountryCode[1].length)}`;
        }
  
        // Return the normalized phone number without adding a country code
        return normalizedPhone;
      };
  
      const normalizeEmail = (email) => (typeof email === 'string' ? email.toLowerCase().trim() : email);
  
      // Normalize the phone number before performing checks
      const normalizedPhone = normalizePhone(req.body.phone);
  
      // Check if any other candidate (excluding the current one) has the same normalized phone number
      const existingCandidate = await Mastersheet.findOne({
        phone: normalizedPhone,
        _id: { $ne: req.params.id }, // Exclude the current candidate being edited
      });
  
      if (existingCandidate) {
        return res.status(400).json({ message: "Candidate with this phone number already exists." });
      }
  
      // Continue with updating the candidate if no duplicates are found
      const newAssignProcess = req.body.assignProcess || candidate.assignProcess;
      const isAssignProcessChanged = newAssignProcess !== candidate.assignProcess;
  
      // Updating candidate with new entries
      candidate.name = req.body.name || candidate.name;
      candidate.email = normalizeEmail(req.body.email) || candidate.email;
      candidate.phone = normalizedPhone || candidate.phone;
      candidate.status = req.body.status || candidate.status;
      candidate.assignProcess = newAssignProcess;
      candidate.interested = req.body.interested || candidate.interested;
      candidate.assignedRecruiter = req.body.assignedRecruiter || candidate.assignedRecruiter;
      candidate.language = req.body.language || candidate.language;
      candidate.jbStatus = req.body.jbStatus || candidate.jbStatus;
      candidate.qualification = req.body.qualification || candidate.qualification;
      candidate.industry = req.body.industry || candidate.industry;
      candidate.domain = req.body.domain || candidate.domain;
      candidate.exp = req.body.exp || candidate.exp;
      candidate.cLocation = req.body.cLocation || candidate.cLocation;
      candidate.pLocation = req.body.pLocation || candidate.pLocation;
      candidate.currentCTC = req.body.currentCTC || candidate.currentCTC;
      candidate.expectedCTC = req.body.expectedCTC || candidate.expectedCTC;
      candidate.noticePeriod = req.body.noticePeriod || candidate.noticePeriod;
      candidate.wfh = req.body.wfh || candidate.wfh;
      candidate.resumeLink = req.body.resumeLink || candidate.resumeLink;
      candidate.linkedinLink = req.body.linkedinLink || candidate.linkedinLink;
      candidate.feedback = req.body.feedback || candidate.feedback;
      candidate.remark = req.body.remark || candidate.remark;
      candidate.company = req.body.company || candidate.company;
      candidate.voiceNonVoice = req.body.voiceNonVoice || candidate.voiceNonVoice;
      candidate.source = req.body.source || candidate.source;
      candidate.createdBy = createdBy;
      candidate.lastUpdatedBy = lastUpdatedBy;
  
      if (isAssignProcessChanged) {
        // If assignProcess is changed
        console.log("AssignProcess changed");
        const [clientName, processName, processLanguage] = newAssignProcess.split(" - ");
  
        const client = await ClientSheet.findOne({
          clientName,
          "clientProcess.clientProcessName": processName,
          "clientProcess.clientProcessLanguage": processLanguage,
        });
  
        if (client) {
          const process = client.clientProcess.find(
            (p) =>
              p.clientProcessName === processName &&
              p.clientProcessLanguage === processLanguage
          );
  
          const newCandidate = {
            candidateId: candidate._id,
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            language: candidate.language,
            jbStatus: candidate.jbStatus,
            qualification: candidate.qualification,
            industry: candidate.industry,
            domain: candidate.domain,
            exp: candidate.exp,
            cLocation: candidate.cLocation,
            pLocation: candidate.pLocation,
            currentCTC: candidate.currentCTC,
            expectedCTC: candidate.expectedCTC,
            noticePeriod: candidate.noticePeriod,
            wfh: candidate.wfh,
            resumeLink: candidate.resumeLink,
            linkedinLink: candidate.linkedinLink,
            feedback: candidate.feedback,
            remark: candidate.remark,
            company: candidate.company,
            voiceNonVoice: candidate.voiceNonVoice,
            source: candidate.source,
            interested: candidate.interested,
            createdBy: createdBy,
            lastUpdatedBy: lastUpdatedBy,
            isProcessAssigned: true,
          };
  
          process.interestedCandidates.push(newCandidate);
  
          candidate.assignProcess = null; // Reset the assignProcess in MasterSheet
          candidate.isProcessAssigned = true;
  
          await client.save();
          await candidate.save();
  
          return res.status(200).json({
            message: "Candidate added to interestedCandidates and updated in MasterSheet",
          });
        } else {
          return res.status(404).json({ message: "Client or process not found" });
        }
      } else {
        // If assignProcess is not changed, update all copies in interestedCandidates[]
        const clients = await ClientSheet.find({
          "clientProcess.interestedCandidates.candidateId": candidate._id,
        });
  
        for (const client of clients) {
          for (const process of client.clientProcess) {
            const interestedCandidate = process.interestedCandidates.find(
              (c) => c.candidateId.toString() === candidate._id.toString()
            );
  
            if (interestedCandidate) {
              interestedCandidate.name = candidate.name;
              interestedCandidate.email = candidate.email;
              interestedCandidate.phone = candidate.phone;
              interestedCandidate.status = candidate.status;
              interestedCandidate.language = candidate.language;
              interestedCandidate.jbStatus = candidate.jbStatus;
              interestedCandidate.qualification = candidate.qualification;
              interestedCandidate.industry = candidate.industry;
              interestedCandidate.domain = candidate.domain;
              interestedCandidate.exp = candidate.exp;
              interestedCandidate.cLocation = candidate.cLocation;
              interestedCandidate.pLocation = candidate.pLocation;
              interestedCandidate.currentCTC = candidate.currentCTC;
              interestedCandidate.expectedCTC = candidate.expectedCTC;
              interestedCandidate.noticePeriod = candidate.noticePeriod;
              interestedCandidate.wfh = candidate.wfh;
              interestedCandidate.resumeLink = candidate.resumeLink;
              interestedCandidate.linkedinLink = candidate.linkedinLink;
              interestedCandidate.feedback = candidate.feedback;
              interestedCandidate.remark = candidate.remark;
              interestedCandidate.company = candidate.company;
              interestedCandidate.voiceNonVoice = candidate.voiceNonVoice;
              interestedCandidate.source = candidate.source;
              interestedCandidate.createdBy = createdBy;
              interestedCandidate.lastUpdatedBy = lastUpdatedBy
            }
          }
          await client.save();
        }
  
        await candidate.save();
        return res.status(200).json({
          message: "Candidate updated in MasterSheet and all duplicate copies",
        });
      }
    } catch (err) {
      console.error("Error updating the Candidate:", err);
      res.status(500).json({ message: err.message });
    }


  })
});



// Updating (POST) and shifting MULTIPLE candidates to intCandidate[] of the process (just assignedRecruiter option)
router.post("/candidates/assign-process", async (req, res) => {
  try {
    const { ids, newAssignProcess } = req.body;

    // Split the newAssignProcess to get client and process details
    const [clientName, processName, processLanguage] =
      newAssignProcess.split(" - ");

    // Fetch the client and process
    const client = await ClientSheet.findOne({
      clientName,
      "clientProcess.clientProcessName": processName,
      "clientProcess.clientProcessLanguage": processLanguage,
    });

    if (!client) {
      return res.status(404).json({ message: "Client or process not found" });
    }

    // Find candidates by IDs
    const candidates = await Mastersheet.find({ _id: { $in: ids } });

    let duplicateCandidates = [];

    for (let candidate of candidates) {

// Ensure createdBy and lastUpdatedBy are handled properly
const { createdBy, lastUpdatedBy } = candidate;

      // Create a new candidate object
      const newCandidate = {
        candidateId: candidate._id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        language: candidate.language,
        jbStatus: candidate.jbStatus,
        qualification: candidate.qualification,
        industry: candidate.industry,
        domain: candidate.domain,
        exp: candidate.exp,
        cLocation: candidate.cLocation,
        pLocation: candidate.pLocation,
        currentCTC: candidate.currentCTC,
        expectedCTC: candidate.expectedCTC,
        noticePeriod: candidate.noticePeriod,
        wfh: candidate.wfh,
        resumeLink: candidate.resumeLink,
        linkedinLink: candidate.linkedinLink,
        feedback: candidate.feedback,
        remark: candidate.remark,
        company: candidate.company,
        voiceNonVoice: candidate.voiceNonVoice,
        source: candidate.source,
        interested: candidate.interested,
        status: candidate.status,
        isProcessAssigned: true, // Set isProcessAssigned to true
        createdBy: createdBy || null, // Ensure createdBy is copied if available
        lastUpdatedBy: lastUpdatedBy || null, // Ensure lastUpdatedBy is copied if available
      };

      console.log(
        "Candidate in the masterSheet after assigning process is: " +
          newCandidate
      );

      // Find the process
      const process = client.clientProcess.find(
        (p) =>
          p.clientProcessName === processName &&
          p.clientProcessLanguage === processLanguage
      );

      // Check if the candidate is already in the interestedCandidates array
      const isDuplicate = process.interestedCandidates.some(
        (c) => c.candidateId.toString() === candidate._id.toString()
      );

      if (!isDuplicate) {
        // Add new candidate to the process
        process.interestedCandidates.push(newCandidate);

        // Update candidate in the MasterSheet
        candidate.assignProcess = null;
        candidate.isProcessAssigned = true; // Set isProcessAssigned to true in MasterSheet

        await candidate.save();
      } else {
        // Add to duplicate candidates list
        duplicateCandidates.push(candidate._id.toString());
      }
    }

    // Save the updated client process
    await client.save();

    if (duplicateCandidates.length > 0) {
      res.status(200).json({
        message:
          "Some candidates were not added because they are already assigned to this process",
        duplicateCandidates,
      });
    } else {
      res
        .status(200)
        .json({ message: "Candidates assigned to process successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// import -> without duplicates (email and phone no) -> but not working for phone number
// router.post("/candidate/import", async (req, res) => {
//   try {
//     const candidates = req.body.data;

//     // Validate data structure
//     if (!Array.isArray(candidates)) {
//       return res.status(400).json({ message: "Data should be an array" });
//     }

//     // const normalizePhone = (phone) => typeof phone === 'number' ? String(phone).replace(/[\s\-]/g, '') : '';

//     // trim to avoid leading and trailing spaces
//     // const normalizePhone = (phone) =>
//     //   typeof phone === 'string' ? phone.trim().replace(/[\s\-]/g, '') : 
//     //   typeof phone === 'number' ? String(phone).trim().replace(/[\s\-]/g, '') : '';

    
//     // trim to avoid leading and trailing spaces as well as COUNTRY CODE (adding + to only those which has it)
//     const normalizePhone = (phone) => {
//       if (typeof phone !== 'string' && typeof phone !== 'number') return '';
    
//       let normalizedPhone = typeof phone === 'number' ? String(phone) : phone;
    
//       // Trim leading and trailing spaces
//       normalizedPhone = normalizedPhone.trim();
    
//       // Check if the number starts with a '+', indicating it has a country code
//       const hasPlus = normalizedPhone.startsWith('+');
    
//       // Remove internal spaces and dashes
//       normalizedPhone = normalizedPhone.replace(/[\s\-]/g, '');
    
//       // If it originally had a '+', retain it; otherwise, leave the number as is
//       if (hasPlus) {
//         return normalizedPhone;
//       } else {
//         // If there’s no leading '+', return the number without altering it
//         return normalizedPhone.replace(/^\+/, ''); // Just a precaution in case a "+" is present accidentally
//       }
//     };
    

//     // trim to avoid leading and trailing spaces as well as COUNTRY CODE (adding + to every field)
//     // const normalizePhone = (phone) => {
//     //   if (typeof phone !== 'string' && typeof phone !== 'number') return '';
    
//     //   let normalizedPhone = typeof phone === 'number' ? String(phone) : phone;
    
//     //   // Trim leading and trailing spaces
//     //   normalizedPhone = normalizedPhone.trim();
    
//     //   // Detect if the number starts with a country code (e.g., +91 or 91)
//     //   const hasCountryCode = normalizedPhone.match(/^(\+?\d{1,3})\s?\d+/);
    
//     //   // Remove internal spaces and dashes
//     //   normalizedPhone = normalizedPhone.replace(/[\s\-]/g, '');
    
//     //   // If there's a country code (with or without a leading +), ensure it's formatted as +<country code>
//     //   if (hasCountryCode) {
//     //     const countryCode = hasCountryCode[1].replace(/^\+/, ''); // Remove any leading +
//     //     normalizedPhone = `+${countryCode}${normalizedPhone.slice(hasCountryCode[1].length)}`;
//     //   }
    
//     //   return normalizedPhone;
//     // };
    

//     const normalizeEmail = (email) => typeof email === 'string' ? email.toLowerCase().trim() : email;
    


//     // Skip the first row if it's a header
//     const filteredCandidates = candidates.slice(1).map((candidate) => {
//       const phone = normalizePhone(candidate[2]);
//       const email = normalizeEmail(candidate[1]);

//       const languages = [];
//       if (candidate[3] || candidate[4] || candidate[5]) {
//         const lTypes = candidate[3] ? candidate[3].split(',').map(item => item.trim()) : [null];
//         const langs = candidate[4] ? candidate[4].split(',').map(item => item.trim()) : [null];
//         const proficiencyLevels = candidate[5] ? candidate[5].split(',').map(item => item.trim()) : [null];

//         for (let i = 0; i < Math.max(lTypes.length, langs.length, proficiencyLevels.length); i++) {
//           languages.push({
//             lType: lTypes[i] || null,
//             lang: langs[i] || null,
//             proficiencyLevel: proficiencyLevels[i] || null
//           });
//         }
//       }

//       return {
//         name: candidate[0],
//         email: email,
//         phone: phone,
//         language: languages,
//         status: null,
//         assignProcess: null,
//         isProcessAssigned: false,
//         interested: null,
//         assignedRecruiter: null,
//         jbStatus: candidate[6],
//         qualification: candidate[7],
//         industry: candidate[8],
//         exp: candidate[9],
//         domain: candidate[10],
//         cLocation: candidate[11],
//         pLocation: candidate[12],
//         currentCTC: Number(candidate[13]) || 0,
//         expectedCTC: Number(candidate[14]) || 0,
//         noticePeriod: candidate[15],
//         wfh: candidate[16],
//         resumeLink: candidate[17],
//         linkedinLink: candidate[18],
//         feedback: candidate[19],
//         remark: candidate[20],
//         company: candidate[21],
//         voiceNonVoice: candidate[22],
//         source: candidate[23],
//       };
//     });

//     const emails = filteredCandidates.map(candidate => candidate.email).filter(email => email !== null && email !== undefined);
//     const phoneNumbers = filteredCandidates.map(candidate => candidate.phone);

//     // Find existing candidates by normalized email or phone number
//     const existingCandidates = await Mastersheet.find({
//       $or: [
//         { email: { $in: emails } },
//         { phone: { $in: phoneNumbers } }
//       ]
//     });

//     const existingEmails = new Set(existingCandidates.map(c => normalizeEmail(c.email)));
//     const existingPhoneNumbers = new Set(existingCandidates.map(c => normalizePhone(c.phone)));

//     // Filter out duplicates based on phone numbers; allow null/undefined emails
//     const nonDuplicateCandidates = filteredCandidates.filter(candidate => 
//       candidate.phone && 
//       !existingPhoneNumbers.has(candidate.phone)
//     );
    

//     // Insert non-duplicate candidates
//     const result = await Mastersheet.insertMany(nonDuplicateCandidates);

//     res.status(201).json({ message: "Data imported successfully", result });
//   } catch (err) {
//     console.error("Error saving the candidates:", err);
//     res.status(500).json({ message: "Failed to create candidates", error: err.message });
//   }
// });


// upodate 2 -> duplicate not allowed on the basis of phone number
router.post("/candidate/import", async (req, res) => {
  try {
    const candidates = req.body.data;

    if (!Array.isArray(candidates)) {
      return res.status(400).json({ message: "Data should be an array" });
    }

    const normalizePhone = (phone) => {
      if (typeof phone !== 'string' && typeof phone !== 'number') return '';
      let normalizedPhone = typeof phone === 'number' ? String(phone) : phone.trim();
      const hasPlus = normalizedPhone.startsWith('+');
      normalizedPhone = normalizedPhone.replace(/[\s\-]/g, '');
      return hasPlus ? normalizedPhone : normalizedPhone.replace(/^\+/, '');
    };

    const normalizeEmail = (email) => typeof email === 'string' ? email.toLowerCase().trim() : email;

    const filteredCandidates = candidates.slice(1).map((candidate) => {
      const phone = normalizePhone(candidate[2]);
      const email = normalizeEmail(candidate[1]);

      const languages = [];
      if (candidate[3] || candidate[4] || candidate[5]) {
        const lTypes = candidate[3] ? candidate[3].split(',').map(item => item.trim()) : [null];
        const langs = candidate[4] ? candidate[4].split(',').map(item => item.trim()) : [null];
        const proficiencyLevels = candidate[5] ? candidate[5].split(',').map(item => item.trim()) : [null];

        for (let i = 0; i < Math.max(lTypes.length, langs.length, proficiencyLevels.length); i++) {
          languages.push({
            lType: lTypes[i] || null,
            lang: langs[i] || null,
            proficiencyLevel: proficiencyLevels[i] || null
          });
        }
      }

      return {
        name: candidate[0],
        email: email,
        phone: phone,
        language: languages,
        status: null,
        assignProcess: null,
        isProcessAssigned: false,
        interested: null,
        assignedRecruiter: null,
        jbStatus: candidate[6],
        qualification: candidate[7],
        industry: candidate[8],
        exp: candidate[9],
        domain: candidate[10],
        cLocation: candidate[11],
        pLocation: candidate[12],
        currentCTC: Number(candidate[13]) || 0,
        expectedCTC: Number(candidate[14]) || 0,
        noticePeriod: candidate[15],
        wfh: candidate[16],
        resumeLink: candidate[17],
        linkedinLink: candidate[18],
        feedback: candidate[19],
        remark: candidate[20],
        company: candidate[21],
        voiceNonVoice: candidate[22],
        source: candidate[23],
      };
    });

    const emails = filteredCandidates.map(candidate => candidate.email).filter(email => email !== null && email !== undefined);
    const phoneNumbers = filteredCandidates.map(candidate => candidate.phone);

    // Find existing candidates by normalized email or phone number
    const existingCandidates = await Mastersheet.find({
      $or: [
        { email: { $in: emails } },
        { phone: { $in: phoneNumbers } }
      ]
    });

    const existingEmails = new Set(existingCandidates.map(c => normalizeEmail(c.email)));
    const existingPhoneNumbers = new Set(existingCandidates.map(c => normalizePhone(c.phone)));

    // Capture duplicates and log them individually
    filteredCandidates.forEach(candidate => {
      if (candidate.phone && existingPhoneNumbers.has(candidate.phone)) {
        console.log(`Duplicate found: ${candidate.phone}`);
      }
    });

    // Filter out duplicates based on phone numbers
    const nonDuplicateCandidates = filteredCandidates.filter(candidate => 
      candidate.phone && !existingPhoneNumbers.has(candidate.phone)
    );

    // Insert non-duplicate candidates
    const result = await Mastersheet.insertMany(nonDuplicateCandidates);

    res.status(201).json({ message: "Data imported successfully", result });
  } catch (err) {
    console.error("Error saving the candidates:", err);
    res.status(500).json({ message: "Failed to create candidates", error: err.message });
  }
});



export default router;


// router.put("/candidates/:id", async (req, res) => {
//   try {
//     const candidate = await Mastersheet.findById(req.params.id);
//     if (!candidate) {
//       return res.status(404).json({ message: "Candidate not found" });
//     }

//     const newAssignProcess = req.body.assignProcess || candidate.assignProcess;
//     const isAssignProcessChanged = newAssignProcess !== candidate.assignProcess;

//     // Updating candidate with new entries
//     candidate.name = req.body.name || candidate.name;
//     candidate.email = req.body.email || candidate.email;
//     candidate.phone = req.body.phone || candidate.phone;
//     candidate.status = req.body.status || candidate.status;
//     candidate.assignProcess = newAssignProcess;
//     candidate.interested = req.body.interested || candidate.interested;
//     candidate.assignedRecruiter =
//       req.body.assignedRecruiter || candidate.assignedRecruiter;
//     candidate.language = req.body.language || candidate.language;
//     candidate.jbStatus = req.body.jbStatus || candidate.jbStatus;
//     candidate.qualification = req.body.qualification || candidate.qualification;
//     candidate.industry = req.body.industry || candidate.industry;
//     candidate.domain = req.body.domain || candidate.domain;
//     candidate.exp = req.body.exp || candidate.exp;
//     candidate.cLocation = req.body.cLocation || candidate.cLocation;
//     candidate.pLocation = req.body.pLocation || candidate.pLocation;
//     candidate.currentCTC = req.body.currentCTC || candidate.currentCTC;
//     candidate.expectedCTC = req.body.expectedCTC || candidate.expectedCTC;
//     candidate.noticePeriod = req.body.noticePeriod || candidate.noticePeriod;
//     candidate.wfh = req.body.wfh || candidate.wfh;
//     candidate.resumeLink = req.body.resumeLink || candidate.resumeLink;
//     candidate.linkedinLink = req.body.linkedinLink || candidate.linkedinLink;
//     candidate.feedback = req.body.feedback || candidate.feedback;
//     candidate.remark = req.body.remark || candidate.remark;
//     candidate.company = req.body.company || candidate.company;
//     candidate.voiceNonVoice = req.body.voiceNonVoice || candidate.voiceNonVoice;
//     candidate.source = req.body.source || candidate.source;

//     if (isAssignProcessChanged) {
//       // If assignProcess is changed
//       console.log("AssignProcess changed");
//       const [clientName, processName, processLanguage] =
//         newAssignProcess.split(" - ");

//       const client = await ClientSheet.findOne({
//         clientName,
//         "clientProcess.clientProcessName": processName,
//         "clientProcess.clientProcessLanguage": processLanguage,
//       });

//       if (client) {
//         const process = client.clientProcess.find(
//           (p) =>
//             p.clientProcessName === processName &&
//             p.clientProcessLanguage === processLanguage
//         );

//         const newCandidate = {
//           candidateId: candidate._id,
//           name: candidate.name,
//           email: candidate.email,
//           phone: candidate.phone,
//           language: candidate.language,
//           jbStatus: candidate.jbStatus,
//           qualification: candidate.qualification,
//           industry: candidate.industry,
//           domain: candidate.domain,
//           exp: candidate.exp,
//           cLocation: candidate.cLocation,
//           pLocation: candidate.pLocation,
//           currentCTC: candidate.currentCTC,
//           expectedCTC: candidate.expectedCTC,
//           noticePeriod: candidate.noticePeriod,
//           wfh: candidate.wfh,
//           resumeLink: candidate.resumeLink,
//           linkedinLink: candidate.linkedinLink,
//           feedback: candidate.feedback,
//           remark: candidate.remark,
//           company: candidate.company,
//           voiceNonVoice: candidate.voiceNonVoice,
//           source: candidate.source,
//           interested: candidate.interested,
//           isProcessAssigned: true,
//         };

//         process.interestedCandidates.push(newCandidate);

//         candidate.assignProcess = null; // Reset the assignProcess in MasterSheet
//         candidate.isProcessAssigned = true;

//         await client.save();
//         await candidate.save();

//         return res.status(200).json({
//           message:
//             "Candidate added to interestedCandidates and updated in MasterSheet",
//         });
//       } else {
//         return res.status(404).json({ message: "Client or process not found" });
//       }
//     } else {
//       // If assignProcess is not changed, update all copies in interestedCandidates[]
//       const clients = await ClientSheet.find({
//         "clientProcess.interestedCandidates.candidateId": candidate._id,
//       });

//       for (const client of clients) {
//         for (const process of client.clientProcess) {
//           const interestedCandidate = process.interestedCandidates.find(
//             (c) => c.candidateId.toString() === candidate._id.toString()
//           );

//           if (interestedCandidate) {
//             interestedCandidate.name = candidate.name;
//             interestedCandidate.email = candidate.email;
//             interestedCandidate.phone = candidate.phone;
//             interestedCandidate.status = candidate.status;
//             interestedCandidate.language = candidate.language;
//             interestedCandidate.jbStatus = candidate.jbStatus;
//             interestedCandidate.qualification = candidate.qualification;
//             interestedCandidate.industry = candidate.industry;
//             interestedCandidate.domain = candidate.domain;
//             interestedCandidate.exp = candidate.exp;
//             interestedCandidate.cLocation = candidate.cLocation;
//             interestedCandidate.pLocation = candidate.pLocation;
//             interestedCandidate.currentCTC = candidate.currentCTC;
//             interestedCandidate.expectedCTC = candidate.expectedCTC;
//             interestedCandidate.noticePeriod = candidate.noticePeriod;
//             interestedCandidate.wfh = candidate.wfh;
//             interestedCandidate.resumeLink = candidate.resumeLink;
//             interestedCandidate.linkedinLink = candidate.linkedinLink;
//             interestedCandidate.feedback = candidate.feedback;
//             interestedCandidate.remark = candidate.remark;
//             interestedCandidate.company = candidate.company;
//             interestedCandidate.voiceNonVoice = candidate.voiceNonVoice;
//             interestedCandidate.source = candidate.source;
//           }
//         }
//         await client.save();
//       }

//       await candidate.save();
//       return res.status(200).json({
//         message: "Candidate updated in MasterSheet and all duplicate copies",
//       });
//     }
//   } catch (err) {
//     console.log("in the catch box");
//     res.status(500).json({ message: err.message });
//   }
// });


// working router.post("/candidate/import", async (req, res) => {
//   try {
//     const candidates = req.body.data;

//     // Validate data structure
//     if (!Array.isArray(candidates)) {
//       return res.status(400).json({ message: "Data should be an array" });
//     }

//     const normalizePhone = (phone) => typeof phone === 'number' ? String(phone).replace(/[\s\-]/g, '') : '';
//     const normalizeEmail = (email) => typeof email === 'string' ? email.toLowerCase().trim() : email;

//     // Skip the first row if it's a header
//     const filteredCandidates = candidates.slice(1).map((candidate) => {
//       const phone = normalizePhone(candidate[2]);
//       const email = normalizeEmail(candidate[1]);

//       const languages = [];
//       if (candidate[3] && candidate[4] && candidate[5]) {
//         const lTypes = candidate[3].split(',').map(item => item.trim());
//         const langs = candidate[4].split(',').map(item => item.trim());
//         const proficiencyLevels = candidate[5].split(',').map(item => item.trim());

//         for (let i = 0; i < lTypes.length; i++) {
//           languages.push({
//             lType: lTypes[i],
//             lang: langs[i],
//             proficiencyLevel: proficiencyLevels[i]
//           });
//         }
//       }

//       return {
//         name: candidate[0],
//         email: email,
//         phone: phone,
//         language: languages,
//         status: null,
//         assignProcess: null,
//         isProcessAssigned: false,
//         interested: null,
//         assignedRecruiter: null,
//         jbStatus: candidate[6],
//         qualification: candidate[7],
//         industry: candidate[8],
//         exp: candidate[9],
//         domain: candidate[10],
//         cLocation: candidate[11],
//         pLocation: candidate[12],
//         currentCTC: Number(candidate[13]) || 0,
//         expectedCTC: Number(candidate[14]) || 0,
//         noticePeriod: candidate[15],
//         wfh: candidate[16],
//         resumeLink: candidate[17],
//         linkedinLink: candidate[18],
//         feedback: candidate[19],
//         remark: candidate[20],
//         company: candidate[21],
//         voiceNonVoice: candidate[22],
//         source: candidate[23],
//       };
//     });

//     const emails = filteredCandidates.map(candidate => candidate.email).filter(email => email !== null && email !== undefined);
//     const phoneNumbers = filteredCandidates.map(candidate => candidate.phone);

//     // Find existing candidates by normalized email or phone number
//     const existingCandidates = await Mastersheet.find({
//       $or: [
//         { email: { $in: emails } },
//         { phone: { $in: phoneNumbers } }
//       ]
//     });

//     const existingEmails = new Set(existingCandidates.map(c => normalizeEmail(c.email)));
//     const existingPhoneNumbers = new Set(existingCandidates.map(c => normalizePhone(c.phone)));

//     // Filter out duplicates based on phone numbers; allow null/undefined emails
//     const nonDuplicateCandidates = filteredCandidates.filter(candidate => 
//       candidate.phone && 
//       !existingPhoneNumbers.has(candidate.phone)
//     );

//     // Insert non-duplicate candidates
//     const result = await Mastersheet.insertMany(nonDuplicateCandidates);

//     res.status(201).json({ message: "Data imported successfully", result });
//   } catch (err) {
//     console.error("Error saving the candidates:", err);
//     res.status(500).json({ message: "Failed to create candidates", error: err.message });
//   }
// });

// working fine router.post("/candidate/import", async (req, res) => {
//   try {
//     const candidates = req.body.data;

//     // Validate data structure
//     if (!Array.isArray(candidates)) {
//       return res.status(400).json({ message: "Data should be an array" });
//     }

//     const normalizePhone = (phone) => typeof phone === 'number' ? String(phone).replace(/[\s\-]/g, '') : '';
//     const normalizeEmail = (email) => typeof email === 'string' ? email.toLowerCase().trim() : '';

//     // Skip the first row if it's a header
//     const filteredCandidates = candidates.slice(1).map((candidate) => {
//       const phone = normalizePhone(candidate[2]);
//       const email = normalizeEmail(candidate[1]);

//       const languages = [];
//       if (candidate[3] && candidate[4] && candidate[5]) {
//         const lTypes = candidate[3].split(',').map(item => item.trim());
//         const langs = candidate[4].split(',').map(item => item.trim());
//         const proficiencyLevels = candidate[5].split(',').map(item => item.trim());

//         for (let i = 0; i < lTypes.length; i++) {
//           languages.push({
//             lType: lTypes[i],
//             lang: langs[i],
//             proficiencyLevel: proficiencyLevels[i]
//           });
//         }
//       }

//       return {
//         name: candidate[0],
//         email: email,
//         phone: phone,
//         language: languages,
//         status: null,
//         assignProcess: null,
//         isProcessAssigned: false,
//         interested: null,
//         assignedRecruiter: null,
//         jbStatus: candidate[6],
//         qualification: candidate[7],
//         industry: candidate[8],
//         exp: candidate[9],
//         domain: candidate[10],
//         cLocation: candidate[11],
//         pLocation: candidate[12],
//         currentCTC: Number(candidate[13]) || 0,
//         expectedCTC: Number(candidate[14]) || 0,
//         noticePeriod: candidate[15],
//         wfh: candidate[16],
//         resumeLink: candidate[17],
//         linkedinLink: candidate[18],
//         feedback: candidate[19],
//         remark: candidate[20],
//         company: candidate[21],
//         voiceNonVoice: candidate[22],
//         source: candidate[23],
//       };
//     });

//     const emails = filteredCandidates.map(candidate => candidate.email);
//     const phoneNumbers = filteredCandidates.map(candidate => candidate.phone);

//     // Find existing candidates by normalized email or phone number
//     const existingCandidates = await Mastersheet.find({
//       $or: [
//         { email: { $in: emails } },
//         { phone: { $in: phoneNumbers } }
//       ]
//     });

//     const existingEmails = new Set(existingCandidates.map(c => normalizeEmail(c.email)));
//     const existingPhoneNumbers = new Set(existingCandidates.map(c => normalizePhone(c.phone)));

//     // Filter out duplicates
//     const nonDuplicateCandidates = filteredCandidates.filter(candidate => 
//       candidate.email && candidate.phone && 
//       !existingEmails.has(candidate.email) && 
//       !existingPhoneNumbers.has(candidate.phone)
//     );

//     // Insert non-duplicate candidates
//     const result = await Mastersheet.insertMany(nonDuplicateCandidates);

//     res.status(201).json({ message: "Data imported successfully", result });
//   } catch (err) {
//     console.error("Error saving the candidates:", err);
//     res.status(500).json({ message: "Failed to create candidates", error: err.message });
//   }
// });




// router.post("/candidate/import", async (req, res) => {
//   try {
//     const candidates = req.body.data;

//     // Validate data structure
//     if (!Array.isArray(candidates)) {
//       return res.status(400).json({ message: "Data should be an array" });
//     }

//     // Extract emails and phone numbers for duplicate checking
//     const emails = [];
//     const phoneNumbers = [];

//     const newCandidates = candidates.map((candidate) => {
//       const languages = [];

//       // Check if the language fields are present and split them
//       if (candidate[3] && candidate[4] && candidate[5]) {
//         const lTypes = candidate[3].split(',').map(item => item.trim());
//         const langs = candidate[4].split(',').map(item => item.trim());
//         const proficiencyLevels = candidate[5].split(',').map(item => item.trim());

//         // Create language objects
//         for (let i = 0; i < lTypes.length; i++) {
//           languages.push({
//             lType: lTypes[i],
//             lang: langs[i],
//             proficiencyLevel: proficiencyLevels[i]
//           });
//         }
//       }

//       // Add to lists for duplicate checking
//       emails.push(candidate[1]);
//       phoneNumbers.push(candidate[2]);

//       return {
//         name: candidate[0],
//         email: candidate[1],
//         phone: candidate[2],
//         language: languages,
//         status: null,
//         assignProcess: null,
//         isProcessAssigned: false,
//         interested: null,
//         assignedRecruiter: null,
//         jbStatus: candidate[6],
//         qualification: candidate[7],
//         industry: candidate[8],
//         exp: candidate[9],
//         domain: candidate[10],
//         cLocation: candidate[11],
//         pLocation: candidate[12],
//         currentCTC: Number(candidate[13]) || 0,
//         expectedCTC: Number(candidate[14]) || 0,
//         noticePeriod: candidate[15],
//         wfh: candidate[16],
//         resumeLink: candidate[17],
//         linkedinLink: candidate[18],
//         feedback: candidate[19],
//         remark: candidate[20],
//         company: candidate[21],
//         voiceNonVoice: candidate[22],
//         source: candidate[23],
//       };
//     });

//     // Find existing candidates by email or phone number
//     const existingCandidates = await Mastersheet.find({
//       $or: [
//         { email: { $in: emails } },
//         { phone: { $in: phoneNumbers } }
//       ]
//     });

//     const existingEmails = new Set(existingCandidates.map(c => c.email));
//     const existingPhoneNumbers = new Set(existingCandidates.map(c => c.phone));

//     // Filter out duplicates
//     const filteredCandidates = newCandidates.filter(candidate => 
//       !existingEmails.has(candidate.email) && 
//       !existingPhoneNumbers.has(candidate.phone)
//     );

//     // Insert non-duplicate candidates
//     const result = await Mastersheet.insertMany(filteredCandidates);

//     res.status(201).json({ message: "Data imported successfully", result });
//   } catch (err) {
//     console.error("Error saving the candidates:", err);
//     res
//       .status(500)
//       .json({ message: "Failed to create candidates", error: err.message });
//   }
// });


// import -> without duplicates (phone no only - not working)
// router.post("/candidate/import", async (req, res) => {
//   try {
//     const candidates = req.body.data;

//     // Validate data structure
//     if (!Array.isArray(candidates)) {
//       return res.status(400).json({ message: "Data should be an array" });
//     }

//     const normalizePhone = (phone) => phone.replace(/[\s\-]/g, '');

//     const phoneNumbers = candidates.map(candidate => normalizePhone(candidate[2]));

//     const newCandidates = candidates.map((candidate) => {
//       const phone = normalizePhone(candidate[2]);
//       const languages = [];

//       // Check if the language fields are present and split them
//       if (candidate[3] && candidate[4] && candidate[5]) {
//         const lTypes = candidate[3].split(',').map(item => item.trim());
//         const langs = candidate[4].split(',').map(item => item.trim());
//         const proficiencyLevels = candidate[5].split(',').map(item => item.trim());

//         // Create language objects
//         for (let i = 0; i < lTypes.length; i++) {
//           languages.push({
//             lType: lTypes[i],
//             lang: langs[i],
//             proficiencyLevel: proficiencyLevels[i]
//           });
//         }
//       }

//       return {
//         name: candidate[0],
//         email: candidate[1],
//         phone: phone, // Normalized phone
//         language: languages,
//         status: null,
//         assignProcess: null,
//         isProcessAssigned: false,
//         interested: null,
//         assignedRecruiter: null,
//         jbStatus: candidate[6],
//         qualification: candidate[7],
//         industry: candidate[8],
//         exp: candidate[9],
//         domain: candidate[10],
//         cLocation: candidate[11],
//         pLocation: candidate[12],
//         currentCTC: Number(candidate[13]) || 0,
//         expectedCTC: Number(candidate[14]) || 0,
//         noticePeriod: candidate[15],
//         wfh: candidate[16],
//         resumeLink: candidate[17],
//         linkedinLink: candidate[18],
//         feedback: candidate[19],
//         remark: candidate[20],
//         company: candidate[21],
//         voiceNonVoice: candidate[22],
//         source: candidate[23],
//       };
//     });

//     // Find existing candidates by normalized phone number
//     const existingCandidates = await Mastersheet.find({
//       phone: { $in: phoneNumbers }
//     });

//     const existingPhoneNumbers = new Set(existingCandidates.map(c => normalizePhone(c.phone)));

//     // Filter out duplicates based only on phone number
//     const filteredCandidates = newCandidates.filter(candidate => 
//       !existingPhoneNumbers.has(candidate.phone)
//     );

//     // Insert non-duplicate candidates
//     const result = await Mastersheet.insertMany(filteredCandidates);

//     res.status(201).json({ message: "Data imported successfully", result });
//   } catch (err) {
//     console.error("Error saving the candidates:", err);
//     res
//       .status(500)
//       .json({ message: "Failed to create candidates", error: err.message });
//   }
// });

// router.post("/candidate/import", async (req, res) => {
//   try {
//     const candidates = req.body.data;

//     // Validate data structure
//     if (!Array.isArray(candidates)) {
//       return res.status(400).json({ message: "Data should be an array" });
//     }

//     // Extract phone numbers for duplicate checking
//     const phoneNumbers = [];

//     const newCandidates = candidates.map((candidate) => {
//       const languages = [];

//       // Check if the language fields are present and split them
//       if (candidate[3] && candidate[4] && candidate[5]) {
//         const lTypes = candidate[3].split(',').map(item => item.trim());
//         const langs = candidate[4].split(',').map(item => item.trim());
//         const proficiencyLevels = candidate[5].split(',').map(item => item.trim());

//         // Create language objects
//         for (let i = 0; i < lTypes.length; i++) {
//           languages.push({
//             lType: lTypes[i],
//             lang: langs[i],
//             proficiencyLevel: proficiencyLevels[i]
//           });
//         }
//       }

//       // Add to list for duplicate checking
//       phoneNumbers.push(candidate[2]);

//       return {
//         name: candidate[0],
//         email: candidate[1],
//         phone: candidate[2],
//         language: languages,
//         status: null,
//         assignProcess: null,
//         isProcessAssigned: false,
//         interested: null,
//         assignedRecruiter: null,
//         jbStatus: candidate[6],
//         qualification: candidate[7],
//         industry: candidate[8],
//         exp: candidate[9],
//         domain: candidate[10],
//         cLocation: candidate[11],
//         pLocation: candidate[12],
//         currentCTC: Number(candidate[13]) || 0,
//         expectedCTC: Number(candidate[14]) || 0,
//         noticePeriod: candidate[15],
//         wfh: candidate[16],
//         resumeLink: candidate[17],
//         linkedinLink: candidate[18],
//         feedback: candidate[19],
//         remark: candidate[20],
//         company: candidate[21],
//         voiceNonVoice: candidate[22],
//         source: candidate[23],
//       };
//     });

//     // Find existing candidates by phone number
//     const existingCandidates = await Mastersheet.find({
//       phone: { $in: phoneNumbers }
//     });

//     const existingPhoneNumbers = new Set(existingCandidates.map(c => c.phone));

//     // Filter out duplicates based only on phone number
//     const filteredCandidates = newCandidates.filter(candidate => 
//       !existingPhoneNumbers.has(candidate.phone)
//     );

//     // Insert non-duplicate candidates
//     const result = await Mastersheet.insertMany(filteredCandidates);

//     res.status(201).json({ message: "Data imported successfully", result });
//   } catch (err) {
//     console.error("Error saving the candidates:", err);
//     res
//       .status(500)
//       .json({ message: "Failed to create candidates", error: err.message });
//   }
// });

// import -> without duplicates (email only - not working)
// router.post("/candidate/import", async (req, res) => {
//   try {
//     const candidates = req.body.data;

//     // Validate data structure
//     if (!Array.isArray(candidates)) {
//       return res.status(400).json({ message: "Data should be an array" });
//     }

//     // Extract emails for duplicate checking
//     const emails = [];

//     const newCandidates = candidates.map((candidate) => {
//       const languages = [];

//       // Check if the language fields are present and split them
//       if (candidate[3] && candidate[4] && candidate[5]) {
//         const lTypes = candidate[3].split(',').map(item => item.trim());
//         const langs = candidate[4].split(',').map(item => item.trim());
//         const proficiencyLevels = candidate[5].split(',').map(item => item.trim());

//         // Create language objects
//         for (let i = 0; i < lTypes.length; i++) {
//           languages.push({
//             lType: lTypes[i],
//             lang: langs[i],
//             proficiencyLevel: proficiencyLevels[i]
//           });
//         }
//       }

//       // Add to list for duplicate checking
//       emails.push(candidate[1]);

//       return {
//         name: candidate[0],
//         email: candidate[1],
//         phone: candidate[2],
//         language: languages,
//         status: null,
//         assignProcess: null,
//         isProcessAssigned: false,
//         interested: null,
//         assignedRecruiter: null,
//         jbStatus: candidate[6],
//         qualification: candidate[7],
//         industry: candidate[8],
//         exp: candidate[9],
//         domain: candidate[10],
//         cLocation: candidate[11],
//         pLocation: candidate[12],
//         currentCTC: Number(candidate[13]) || 0,
//         expectedCTC: Number(candidate[14]) || 0,
//         noticePeriod: candidate[15],
//         wfh: candidate[16],
//         resumeLink: candidate[17],
//         linkedinLink: candidate[18],
//         feedback: candidate[19],
//         remark: candidate[20],
//         company: candidate[21],
//         voiceNonVoice: candidate[22],
//         source: candidate[23],
//       };
//     });

//     // Find existing candidates by email
//     const existingCandidates = await Mastersheet.find({
//       email: { $in: emails }
//     });

//     const existingEmails = new Set(existingCandidates.map(c => c.email));

//     // Filter out duplicates based only on email
//     const filteredCandidates = newCandidates.filter(candidate => 
//       !existingEmails.has(candidate.email)
//     );

//     // Insert non-duplicate candidates
//     const result = await Mastersheet.insertMany(filteredCandidates);

//     res.status(201).json({ message: "Data imported successfully", result });
//   } catch (err) {
//     console.error("Error saving the candidates:", err);
//     res
//       .status(500)
//       .json({ message: "Failed to create candidates", error: err.message });
//   }
// });








// --------------------------------------------------------------------------------------------------------

// Updating (POST) and shifting MULTIPLE candidates to intCandidate[] of the process (just assignedRecruiter option)
// router.post("/candidates/assign-process", async (req, res) => {
//   try {
//     const { ids, newAssignProcess } = req.body;

//     // Split the newAssignProcess to get client and process details
//     const [clientName, processName, processLanguage] = newAssignProcess.split(" - ");

//     // Fetch the client and process
//     const client = await ClientSheet.findOne({
//       clientName,
//       "clientProcess.clientProcessName": processName,
//       "clientProcess.clientProcessLanguage": processLanguage,
//     });

//     if (!client) {
//       return res.status(404).json({ message: "Client or process not found" });
//     }

//     // Find candidates by IDs
//     const candidates = await Mastersheet.find({ _id: { $in: ids } });

//     let duplicateCandidates = [];

//     for (let candidate of candidates) {
//       // Create a new candidate object
//       const newCandidate = {
//         candidateId: candidate._id,
//         name: candidate.name,
//         email: candidate.email,
//         phone: candidate.phone,
//         language: candidate.language,
//         jbStatus: candidate.jbStatus,
//         qualification: candidate.qualification,
//         industry: candidate.industry,
//         domain: candidate.domain,
//         exp: candidate.exp,
//         cLocation: candidate.cLocation,
//         pLocation: candidate.pLocation,
//         currentCTC: candidate.currentCTC,
//         expectedCTC: candidate.expectedCTC,
//         noticePeriod: candidate.noticePeriod,
//         wfh: candidate.wfh,
//         resumeLink: candidate.resumeLink,
//         linkedinLink: candidate.linkedinLink,
//         feedback: candidate.feedback,
//         remark: candidate.remark,
//         company: candidate.company,
//         voiceNonVoice: candidate.voiceNonVoice,
//         source: candidate.source,
//         interested: candidate.interested,
//       };

//       // Find the process
//       const process = client.clientProcess.find(
//         (p) =>
//           p.clientProcessName === processName &&
//           p.clientProcessLanguage === processLanguage
//       );

//       // Check if the candidate is already in the interestedCandidates array
//       const isDuplicate = process.interestedCandidates.some(
//         (c) => c.candidateId.toString() === candidate._id.toString()
//       );

//       if (!isDuplicate) {
//         // Add new candidate to the process
//         process.interestedCandidates.push(newCandidate);

//         // Update candidate in the MasterSheet
//         candidate.assignProcess = null;
//         await candidate.save();
//       } else {
//         // Add to duplicate candidates list
//         duplicateCandidates.push(candidate._id.toString());
//       }
//     }

//     // Save the updated client process
//     await client.save();

//     if (duplicateCandidates.length > 0) {
//       res.status(200).json({
//         message: "Some candidates were not added because they are already assigned to this process",
//         duplicateCandidates
//       });
//     } else {
//       res.status(200).json({ message: "Candidates assigned to process successfully" });
//     }
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });









// router.post("/candidate/import", async (req, res) => {
//   try {
//     const candidates = req.body.data;

//     // Validate data structure
//     if (!Array.isArray(candidates)) {
//       return res.status(400).json({ message: "Data should be an array" });
//     }

//     // Process each candidate in the array
//     const newCandidates = candidates.map((candidate) => {
//       const languages = [];

//       // Check if the language fields are present and split them
//       if (candidate[3] && candidate[4] && candidate[5]) {
//         const lTypes = candidate[3].split(',').map(item => item.trim());
//         const langs = candidate[4].split(',').map(item => item.trim());
//         const proficiencyLevels = candidate[5].split(',').map(item => item.trim());

//         // Create language objects
//         for (let i = 0; i < lTypes.length; i++) {
//           languages.push({
//             lType: lTypes[i],
//             lang: langs[i],
//             proficiencyLevel: proficiencyLevels[i]
//           });
//         }
//       }


//       return {
//         name: candidate[0],
//         email: candidate[1],
//         phone: candidate[2],
//         language: languages,
//         status: null,
//         assignProcess: null,
//         isProcessAssigned: false,
//         interested: null,
//         assignedRecruiter: null,
//         jbStatus: candidate[6],
//         qualification: candidate[7],
//         industry: candidate[8],
//         exp: candidate[9],
//         domain: candidate[10],
//         cLocation: candidate[11],
//         pLocation: candidate[12],
//         currentCTC: Number(candidate[13]) || 0,
//         expectedCTC: Number(candidate[14]) || 0,
//         noticePeriod: candidate[15],
//         wfh: candidate[16],
//         resumeLink: candidate[17],
//         linkedinLink: candidate[18],
//         feedback: candidate[19],
//         remark: candidate[20],
//         company: candidate[21],
//         voiceNonVoice: candidate[22],
//         source: candidate[23],
//       };
//     });

//     // Insert many documents at once
//     const result = await Mastersheet.insertMany(newCandidates);
//     res.status(201).json({ message: "Data imported successfully", result });
//   } catch (err) {
//     console.error("Error saving the candidates:", err);
//     res
//       .status(500)
//       .json({ message: "Failed to create candidates", error: err.message });
//   }
// });







