import express from "express";
import mongoose from "mongoose";
import ClientSheet from "../models/Client.js";
import Mastersheet from "../models/Mastersheet.js";
// import Users from "../models/Users.js";
import moment from "moment-timezone";
import jwt from "jsonwebtoken";

const secretKey = "secretKey";

const router = express.Router();

// function to get the current date in IST
const getCurrentISTDate = () => {
  return moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
};

// checking api
router.get("/", (req, res) => {
  res.status(200).send({
    msg: "Client's APIs are working perfectly",
  });
});

// middleware for verifying the token
function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader != "undefined") {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    req.token = token;
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Invalid login" });
  }
}

// -------------------------------------- client ---------------------------------------

// creating new client
router.post("/clients", async (req, res) => {
  try {
    const { clientName, clientVertical, clientPoc } = req.body;

    const client = new ClientSheet({
      clientName,
      clientVertical,
      clientPoc,
      clientProcess: [], // Initially empty
    });

    const newClient = await client.save();
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// get all clients
router.get("/clients", async (req, res) => {
  try {
    const clients = await ClientSheet.find();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get all processes across all clients
router.get("/clients/processes", async (req, res) => {
  try {
    const clients = await ClientSheet.find();
    let allProcesses = [];

    clients.forEach((client) => {
      allProcesses = allProcesses.concat(client.clientProcess);
    });

    res.status(200).json(allProcesses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get client by id
router.get("/clients/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const client = await ClientSheet.findById(id);
    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// delete client by id and update candidates in Mastersheet
router.delete("/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the client by ID
    const client = await ClientSheet.findById(id);

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    // Extract client name for updating the candidates in Mastersheet
    const clientName = client.clientName;

    // Delete the client first
    await client.deleteOne();

    // Now update candidates where isProcessAssigned=true and assignProcess includes the clientName
    const updateResult = await Mastersheet.updateMany(
      {
        isProcessAssigned: true, 
        assignProcess: { $regex: new RegExp(`^${clientName} -`, 'i') } // matches "Amazon -" or any process tied to Amazon
      },
      { 
        $set: {
          isProcessAssigned: false,
          assignProcess: null,
          assignedRecruiter: null
        }
      }
    );

    // Send response based on update result
    if (updateResult.modifiedCount > 0) {
      res.json({ 
        message: `Client and associated candidates updated successfully. ${updateResult.modifiedCount} candidates updated.`
      });
    } else {
      res.json({ 
        message: "Client deleted successfully. No candidates were assigned to this client's process."
      });
    }

  } catch (error) {
    console.error('Error deleting client and updating candidates:', error);
    res.status(500).json({
      message: "Server error: " + error.message,
    });
  }
});


// update client by id
router.put("/clients/:id", async (req, res) => {
  try {
    let { id } = req.params;

    // Trim any leading colons or other characters from the ID
    id = id.replace(/^:/, "");

    // Check if the provided id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid client ID: ${id}`);
      return res.status(400).json({
        message: "Invalid client id",
      });
    }

    const orgClient = await ClientSheet.findById(id);

    orgClient.clientName = req.body.clientName || orgClient.clientName;
    orgClient.clientVertical =
      req.body.clientVertical || orgClient.clientVertical;
    orgClient.clientPoc = req.body.clientPoc || orgClient.clientPoc;
    orgClient.clientProcess = req.body.clientProcess || orgClient.clientProcess;

    const updatedClient = await orgClient.save();
    res.json(updatedClient);
    console.log("Updated client is: " + updatedClient);
  } catch (error) {
    console.log("Error while updating the client");
    res.status(400).json({
      message: error.message,
    });
  }
});

// ----------------------------------------- process ------------------------------------------

// create process and also update the assignProcess field
router.post("/clients/:clientId/process", async (req, res) => {
  const { clientId } = req.params;
  const newProcess = req.body;

  try {
    const client = await ClientSheet.findById(clientId);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Convert dates to IST
    if (newProcess.clientProcessDeadline) {
      newProcess.clientProcessDeadline = moment(
        newProcess.clientProcessDeadline
      )
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");
    }
    if (newProcess.clientProcessJoining) {
      newProcess.clientProcessJoining = moment(newProcess.clientProcessJoining)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");
    }

    client.clientProcess.push(newProcess);
    await client.save();

    // Get all active processes across all clients
    const allClients = await ClientSheet.find();
    let activeProcesses = [];

    allClients.forEach((client) => {
      client.clientProcess.forEach((process) => {
        activeProcesses.push({
          clientName: client.clientName,
          clientProcessName: process.clientProcessName,
          clientProcessLanguage: process.clientProcessLanguage,
        });
      });
    });

    // Update assignProcess field for all candidates
    const processInfoList = activeProcesses.map(
      (process) =>
        `${process.clientName} - ${process.clientProcessName} - ${process.clientProcessLanguage}`
    );

    console.log(
      "---------------------------Process options is updated after creation of one process------------------------------"
    );

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get all processess of particular client
router.get("/clients/:clientId/processes", async (req, res) => {
  const { clientId } = req.params;

  try {
    const client = await ClientSheet.findById(clientId);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json(client.clientProcess);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get process by id
router.get("/clients/:clientId/process/:processId", async (req, res) => {
  const { clientId, processId } = req.params;

  try {
    const client = await ClientSheet.findById(clientId);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const process = client.clientProcess.id(processId);

    if (!process) {
      return res.status(404).json({ message: "Process not found" });
    }

    res.status(200).json(process);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// delete process by id
router.delete("/clients/:clientId/process/:processId", async (req, res) => {
  const { clientId, processId } = req.params;

  try {
    // Find the client by ID
    const client = await ClientSheet.findById(clientId);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Find the process within the client
    const process = client.clientProcess.id(processId);

    if (!process) {
      return res.status(404).json({ message: "Process not found" });
    }

    // Store process details before deleting for candidate updates
    const clientName = client.clientName;
    const processName = process.clientProcessName;
    const processLanguage = process.clientProcessLanguage;

    // Delete the process
    process.deleteOne();
    await client.save();

    // Now update candidates where the assignProcess matches the deleted process details
    const assignProcessString = `${clientName} - ${processName} - ${processLanguage}`;
    
    const updateResult = await Mastersheet.updateMany(
      {
        isProcessAssigned: true, 
        assignProcess: assignProcessString
      },
      { 
        $set: {
          isProcessAssigned: false,
          assignProcess: null,
          assignedRecruiter: null
        }
      }
    );

    // Send response based on the number of candidates updated
    if (updateResult.modifiedCount > 0) {
      res.json({ 
        message: `Process deleted successfully. ${updateResult.modifiedCount} candidates updated.`
      });
    } else {
      res.json({ 
        message: "Process deleted successfully. No candidates were assigned to this process."
      });
    }

  } catch (error) {
    console.error('Error deleting process and updating candidates:', error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});


// Endpoint to fetch assignProcess options to be used in the frontend
router.get("/process-options", async (req, res) => {
  try {
    // Get all active processes across all clients
    const allClients = await ClientSheet.find();
    let activeProcesses = [];

    allClients.forEach((client) => {
      client.clientProcess.forEach((process) => {
        activeProcesses.push({
          clientName: client.clientName,
          clientProcessName: process.clientProcessName,
          clientProcessLanguage: process.clientProcessLanguage,
        });
      });
    });

    // Format active processes into unique identifiers
    const processInfoList = activeProcesses.map(
      (process) =>
        `${process.clientName} - ${process.clientProcessName} - ${process.clientProcessLanguage}`
    );

    res.status(200).json([...new Set(processInfoList)]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------------------------- Candidates wrt Process ----------------------------

// ----------------- PUT FOR PROCESS ---------------------------

// find the particular candidate accross every process:
router.get('/candidate', async (req, res) => {
  try {
    // Extract candidateId from request body
    const { name } = req.body;
    // const { candidateId } = req.body;

    // Check if candidateId is provided
    if (!name) {
      return res.status(400).json({ message: 'Candidate ID is required' });
    // if (!candidateId) {
    //   return res.status(400).json({ message: 'Candidate ID is required' });
    }

    // Validate candidateId format (optional)
    // if (!mongoose.Types.ObjectId.isValid(candidateId)) {
    //   return res.status(400).json({ message: 'Invalid Candidate ID format' });
    // }

    // Query to search for the candidate across all processes
    const clientData = await ClientSheet.find({
      'clientProcess.interestedCandidates.name': name,
    }, {
      'clientProcess.$': 1 // Project only the matched client processes
    });
    // const clientData = await ClientSheet.find({
    //   'clientProcess.interestedCandidates.candidateId': candidateId,
    // }, {
    //   'clientProcess.$': 1 // Project only the matched client processes
    // });

    if (!clientData || clientData.length === 0) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Create an array to store results with process names
    let results = [];

    // Loop through all the returned client processes to find the candidate
    clientData.forEach(client => {
      client.clientProcess.forEach(process => {
        const candidate = process.interestedCandidates.find(c => c.name.toString() === name);

        if (candidate) {
          // Add candidate and process information to the results array
          results.push({
            ...candidate._doc, // Spread all the candidate data
            processName: process.clientProcessName // Add process name to the result
          });
        }
      });
    });
    // clientData.forEach(client => {
    //   client.clientProcess.forEach(process => {
    //     const candidate = process.interestedCandidates.find(c => c.candidateId.toString() === candidateId);

    //     if (candidate) {
    //       // Add candidate and process information to the results array
    //       results.push({
    //         ...candidate._doc, // Spread all the candidate data
    //         processName: process.clientProcessName // Add process name to the result
    //       });
    //     }
    //   });
    // });

    // Send the filtered results back
    res.status(200).json(results);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT request to update process details other than candidates
router.put("/clients/:clientId/processes/:processId", async (req, res) => {
  try {
    const { clientId, processId } = req.params;

    // Find the client
    const client = await ClientSheet.findById(clientId);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Find the process within the client
    const process = client.clientProcess.id(processId);

    if (!process) {
      return res.status(404).json({ message: "Process not found" });
    }

    // Update the process's details based on the request body
    process.clientProcessName =
      req.body.clientProcessName || process.clientProcessName;
    process.clientProcessLanguage =
      req.body.clientProcessLanguage || process.clientProcessLanguage;
    process.clientProcessPoc =
      req.body.clientProcessPoc || process.clientProcessPoc;
    process.interestedCandidates =
      req.body.interestedCandidates || process.interestedCandidates;
    process.clientProcessCandReq =
      req.body.clientProcessCandReq || process.clientProcessCandReq;

    // Convert dates to IST
    if (req.body.clientProcessDeadline) {
      process.clientProcessDeadline = moment(req.body.clientProcessDeadline)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");
    }
    if (req.body.clientProcessJoining) {
      process.clientProcessJoining = moment(req.body.clientProcessJoining)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");
    }

    process.clientProcessPckg =
      req.body.clientProcessPckg || process.clientProcessPckg;
    process.clientProcessLocation =
      req.body.clientProcessLocation || process.clientProcessLocation;

    process.clientProcessPerks =
      req.body.clientProcessPerks || process.clientProcessPerks;
    process.clientProcessJobDesc =
      req.body.clientProcessJobDesc || process.clientProcessJobDesc;

    // Mark the subdocument as modified
    // client.markModified('clientProcess');

    // Save the parent document after updating process details
    await client.save();

    // Reload the client document to check if the process was updated
    const updatedClient = await ClientSheet.findById(clientId);
    const updatedProcess = updatedClient.clientProcess.id(processId);

    res
      .status(200)
      .json({ message: "Process updated successfully", updatedProcess });
  } catch (error) {
    console.error("Error updating process:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// PUT request to update specific candidate's specific details within a process
router.put(
  "/clients/:clientId/processes/:processId/candidates/:candidateId",
  verifyToken,
  async (req, res) => {
    jwt.verify(req.token, secretKey, async (err, authData) => {
      if (err) {
        return res.status(403).json({ message: "Forbidden: Invalid Token" });
      }

      console.log("in this api");

      const lastUpdatedBy = authData.username;

      try {
        const { clientId, processId, candidateId } = req.params;

        console.log("inside the put function of client sheet");

        // Find the client
        const client = await ClientSheet.findById(clientId);

        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }

        // Find the process within the client
        const process = client.clientProcess.id(processId);

        if (!process) {
          return res.status(404).json({ message: "Process not found" });
        }

        // Find the interested candidate within the process
        const candidate = process.interestedCandidates.id(candidateId);

        if (!candidate) {
          return res
            .status(404)
            .json({ message: "Candidate not found in the process" });
        }

        // retain the created by field
        const createdBy = candidate.createdBy;

        // get the current date
        const currentISTDate = getCurrentISTDate();

        // Update specific fields in the interested candidate[]
        (candidate.name = req.body.name),
          (candidate.email = req.body.email),
          (candidate.phone = req.body.phone),
          (candidate.language = req.body.language);
        (candidate.qualification = req.body.qualification),
          (candidate.industry = req.body.industry),
          (candidate.domain = req.body.domain),
          (candidate.exp = req.body.exp),
          (candidate.cLocation = req.body.cLocation),
          (candidate.pLocation = req.body.pLocation),
          (candidate.currentCTC = req.body.currentCTC),
          (candidate.expectedCTC = req.body.expectedCTC),
          (candidate.noticePeriod = req.body.noticePeriod),
          (candidate.wfh = req.body.wfh),
          (candidate.resumeLink = req.body.resumeLink),
          (candidate.linkedinLink = req.body.linkedinLink),
          (candidate.feedback = req.body.feedback),
          (candidate.remark = req.body.remark),
          (candidate.company = req.body.company),
          (candidate.voiceNonVoice = req.body.voiceNonVoice),
          (candidate.source = req.body.source),
          // complex fields
          (candidate.assignedRecruiter =
            req.body.assignedRecruiter || candidate.assignedRecruiter);
        candidate.status = req.body.status || candidate.status;
        candidate.interested = req.body.interested || candidate.interested;
        candidate.lastUpdatedBy = lastUpdatedBy;
        (candidate.createdBy = createdBy),
          console.log("Candidate Status:", candidate.status);
        console.log("Candidate Interested:", candidate.interested);

        candidate.regId = req.body.regId || candidate.regId;
        candidate.aadhar = req.body.aadhar || candidate.aadhar;
        candidate.empId = req.body.empId || candidate.empId;
        candidate.dob = req.body.dob || candidate.dob;
        candidate.father = req.body.father || candidate.father;

        candidate.regStatus = req.body.regStatus || candidate.regStatus;
        candidate.iaScore = req.body.iaScore || candidate.iaScore;

        // Immediately set isProcessAssigned based on status and interested values
        if (candidate.interested !== "interested") {
          // If interested is not "interested", isProcessAssigned should be false
          candidate.isProcessAssigned = false;
        } else if (candidate.status === "Rejected") {
          // If interested is "interested" and status is "Rejected", isProcessAssigned should be false
          candidate.isProcessAssigned = false;
        } else if (candidate.status === "selected") {
          candidate.isProcessAssigned = false;
        } else {
          // If interested is "interested" and status is not "Rejected", isProcessAssigned should be true
          candidate.isProcessAssigned = true;
        }

        console.log(
          "Is process assigned after the logic: " + candidate.isProcessAssigned
        );

        // Fields to update in the MasterSheet and other copies
        const fieldsToUpdateInMaster = {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          language: req.body.language,
          jbStatus: req.body.jbStatus,
          qualification: req.body.qualification,
          industry: req.body.industry,
          domain: req.body.domain,
          exp: req.body.exp,
          cLocation: req.body.cLocation,
          pLocation: req.body.pLocation,
          currentCTC: req.body.currentCTC,
          expectedCTC: req.body.expectedCTC,
          noticePeriod: req.body.noticePeriod,
          wfh: req.body.wfh,
          resumeLink: req.body.resumeLink,
          linkedinLink: req.body.linkedinLink,
          feedback: req.body.feedback,
          remark: req.body.remark,
          company: req.body.company,
          voiceNonVoice: req.body.voiceNonVoice,
          source: req.body.source,
          isProcessAssigned: candidate.isProcessAssigned,
          assignProcess: candidate.isProcessAssigned
            ? req.body.assignProcess
            : null,
          createdBy: createdBy,
          lastUpdatedBy: lastUpdatedBy,

          regId: req.body.regId,
          aadhar: req.body.aadhar,
          empId: req.body.empId,
          dob: req.body.dob,
          father: req.body.father,

          lastUpdateDate: currentISTDate,
          taskDate: currentISTDate,
        };

        // Find and update the candidate in the MasterSheet
        const masterCandidate = await Mastersheet.findById(
          candidate.candidateId
        );

        if (masterCandidate) {
          Object.assign(masterCandidate, fieldsToUpdateInMaster);

          await masterCandidate.save();

          // Find and update all copies of the candidate in other processes
          const clients = await ClientSheet.find({
            "clientProcess.interestedCandidates.candidateId":
              candidate.candidateId,
          });

          for (const client of clients) {
            for (const process of client.clientProcess) {
              for (const candidateCopy of process.interestedCandidates) {
                if (
                  candidateCopy.candidateId.toString() ===
                  candidate.candidateId.toString()
                ) {
                  Object.assign(candidateCopy, fieldsToUpdateInMaster);
                }
              }
            }
            // await client.save();
          }
        } else {
          console.warn(
            `Master candidate with ID ${candidate.candidateId} not found.`
          );
        }

        // Save the client document after updating candidate details
        await client.save();

        res.status(200).json({
          message: "Candidate details updated successfully",
          candidate,
        });
      } catch (error) {
        console.error("Error updating candidate details:", error);
        res.status(500).json({ message: "Server error", error });
      }
    });
  }
);

// PUT request to handle multiple candidates, to assign a common recruiter (holds a function call for the updateRecruiterCounts function given below)
router.put(
  "/clients/assign-recruiter/:clientId/:processId",
  async (req, res) => {
    const { clientId, processId } = req.params;
    const { ids, recruiterId, newAssignedRecruiter } = req.body;

    if (!ids) {
      return res.status(400).json({ message: "Invalid request body" });
    }

    try {
      const client = await ClientSheet.findById(clientId);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Find the correct process within clientProcess array
      const processToUpdate = client.clientProcess.find(
        (process) => process._id.toString() === processId
      );

      if (!processToUpdate) {
        return res.status(404).json({ message: "Process not found" });
      }

      const candidateObjectIds = ids.map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      // Get the current date in IST
      const currentDateInIST = moment()
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");

      // Iterate over each candidate ID to update or remove recruiter
      for (let candidateId of candidateObjectIds) {
        const candidate = processToUpdate.interestedCandidates.find(
          (c) => c._id.toString() === candidateId.toString()
        );

        if (candidate) {
          if (recruiterId === null && newAssignedRecruiter === null) {
            // If null, reset the recruiter information (undo operation)
            candidate.assignedRecruiter = null;
            candidate.assignedRecruiterId = null;
            candidate.assignedRecruiterDate = null;
          } else {
            // Convert recruiterId to ObjectId for MongoDB
            const recruiterObjectId = new mongoose.Types.ObjectId(recruiterId);

            // Normal assignment
            candidate.assignedRecruiter = newAssignedRecruiter;
            candidate.assignedRecruiterId = recruiterObjectId;
            candidate.assignedRecruiterDate = currentDateInIST;
          }
        }
      }

      // Save the updated client
      await client.save();

      res
        .status(200)
        .json({ message: "Recruiters assigned or removed successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);


// API to undo recruiter assignments for multiple candidates
router.put('/undo-multiple-recruiter-assignments', async (req, res) => {
  try {
    const { clientId, ids } = req.body; // Array of candidate IDs

    // Perform the update: Set assignedRecruiter, recruiterId, and date to null for the selected candidates
    await Candidate.updateMany(
      { _id: { $in: ids }, clientId: clientId },
      { $set: { assignedRecruiter: null, recruiterId: null, date: null } }
    );

    res.status(200).send({ message: 'Recruiter assignments undone successfully' });
  } catch (error) {
    console.error('Error undoing recruiter assignments', error);
    res.status(500).send({ message: 'Failed to undo recruiter assignments' });
  }
});


// router.put(
//   "/clients/assign-recruiter/:clientId/:processId",
//   async (req, res) => {
//     const { clientId, processId } = req.params;
//     const { ids, recruiterId, newAssignedRecruiter } = req.body;

//     if (!ids || !recruiterId || !newAssignedRecruiter) {
//       return res.status(400).json({ message: "Invalid request body" });
//     }

//     try {
//       const client = await ClientSheet.findById(clientId);

//       if (!client) {
//         return res.status(404).json({ message: "Client not found" });
//       }

//       // Find the correct process within clientProcess array
//       const processToUpdate = client.clientProcess.find(
//         (process) => process._id.toString() === processId
//       );

//       if (!processToUpdate) {
//         return res.status(404).json({ message: "Process not found" });
//       }

//       // Convert recruiterId to ObjectId
//       const recruiterObjectId = new mongoose.Types.ObjectId(recruiterId);

//       // Convert candidate IDs to ObjectId
//       const candidateObjectIds = ids.map(
//         (id) => new mongoose.Types.ObjectId(id)
//       );

//       // Get the current date in IST
//       const currentDateInIST = moment()
//         .tz("Asia/Kolkata")
//         .format("YYYY-MM-DD HH:mm:ss");

//       // Array to store IDs of candidates already assigned to the same recruiter
//       let alreadyAssignedCandidates = [];

//       // Iterate over each candidate ID to check and update
//       for (let candidateId of candidateObjectIds) {
//         const candidate = processToUpdate.interestedCandidates.find(
//           (c) => c._id.toString() === candidateId.toString()
//         );

//         if (candidate) {
//           if (candidate.assignedRecruiterId?.equals(recruiterObjectId)) {
//             alreadyAssignedCandidates.push(candidate._id.toString());
//           } else {
//             candidate.assignedRecruiter = newAssignedRecruiter;
//             candidate.assignedRecruiterId = recruiterObjectId;
//             candidate.assignedRecruiterDate = currentDateInIST;
//           }
//         }
//       }

//       // Save the updated client
//       await client.save();

//       // update the counts in the user schema
//       // await updateRecruiterCounts(recruiterId);

//       // Prepare response message
//       if (alreadyAssignedCandidates.length > 0) {
//         res.status(200).json({
//           message: "Some candidates were already assigned to this recruiter",
//           alreadyAssignedCandidates,
//         });
//       } else {
//         res.status(200).json({ message: "Recruiters assigned successfully" });
//       }
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   }
// );

// getting the selected candidates
router.get("/selected-candidates", async (req, res) => {
  try {
    // Fetch all clients
    const clients = await ClientSheet.find({});

    // Initialize an array to store selected candidates with enhanced data
    let selectedCandidates = [];

    // Loop through each client and extract selected candidates with additional fields
    clients.forEach((client) => {
      client.clientProcess.forEach((process) => {
        process.interestedCandidates.forEach((candidate) => {
          if (candidate.status === "selected") {
            // Construct additional fields
            const clientId = client._id;
            const clientProcessId = process._id;
            const clientInfo = `${client.clientName} - ${process.clientProcessName} - ${process.clientProcessLanguage}`;

            // Add candidate with enhanced data to the response array
            selectedCandidates.push({
              candidate,
              clientId,
              clientProcessId,
              clientInfo,
            });
          }
        });
      });
    });

    // Return the response with selected candidates and additional fields
    res.status(200).json(selectedCandidates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete candidate from interestedCandidates array
router.delete(
  "/clients/:clientId/process/:processId/candidates/:candidateId",
  async (req, res) => {
    try {
      const { clientId, processId, candidateId } = req.params;

      // Find the client
      const client = await ClientSheet.findById(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Find the process within the client
      const process = client.clientProcess.id(processId);
      if (!process) {
        return res.status(404).json({ message: "Process not found" });
      }

      // Find the candidate within the interestedCandidates array
      const candidateIndex = process.interestedCandidates.findIndex(
        (candidate) => candidate.candidateId.toString() === candidateId
      );

      if (candidateIndex === -1) {
        return res
          .status(404)
          .json({ message: "Candidate not found in interestedCandidates" });
      }

      // Remove the candidate from the interestedCandidates array
      process.interestedCandidates.splice(candidateIndex, 1);

      // Update the client document
      await client.save();

      console.log("in deleting candidate from int cand[]");

      // Optionally, update the candidate's isProcessAssigned field in the Mastersheet
      await Mastersheet.findByIdAndUpdate(candidateId, {
        assignProcess: null,
        isProcessAssigned: false,
      });

      res.status(200).json({
        message: "Candidate removed from interestedCandidates successfully",
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

//  ----------- Language filters API ---------------------------

// adding lang and proficiency filter for filtersheet (client is not defined issue is coming)
// router.get('/filteredCandidatesFilter/:clientId/:processId/:lang?/:proficiencyLevels?/:exp?', async (req, res) => {
//   const { clientId, processId, lang, proficiencyLevels, exp } = req.params;  // Changed from req.query to req.params

//   try {
//     // Find the client by clientId
//     const client = await ClientSheet.findById(clientId);

//     if (!client) {
//       return res.status(404).json({ message: "Client not found" });
//     }

//     // Find the process by processId
//     const process = client.clientProcess.id(processId);

//     if (!process) {
//       return res.status(404).json({ message: "Process not found" });
//     }

//     // Initialize filter conditions for candidates
//     let filterConditions = {};

//     // Handle Language and Proficiency Filter
//     if (lang || proficiencyLevels) {
//       filterConditions.language = { $elemMatch: {} };

//       if (lang) {
//         filterConditions.language.$elemMatch.lang = lang;
//       }

//       if (proficiencyLevels) {
//         const proficiencyLevelsArray = proficiencyLevels.split(","); // Split the comma-separated proficiency levels
//         filterConditions.language.$elemMatch.proficiencyLevel = {
//           $in: proficiencyLevelsArray,
//         };
//       }
//     }

//     // Handle Experience Filter
//     if (exp) {
//       if (exp.toLowerCase() === 'fresher' || exp === '0') {
//         filterConditions.exp = { $in: ['Fresher', 'fresher', '0'] };  // Ensure 0 is treated as string
//       } else if (exp.includes('-')) {
//         // Handle range filtering like '1-3'
//         const [min, max] = exp.split('-').map(val => parseFloat(val.trim()));

//         if (isNaN(min) || isNaN(max)) {
//           return res.status(400).json({ error: "Invalid experience range format" });
//         }

//         // Ensure numeric comparison
//         filterConditions.exp = {
//           $gte: min,
//           $lte: max,
//         };
//       } else if (exp === '10+') {
//         // Handle '10+' case, filter candidates with experience greater than or equal to 10.1
//         filterConditions.exp = { $gte: 10.1 };
//       }
//     }

//     // Log the constructed filter for debugging
//     console.log("Constructed filter:", filterConditions);

//     // Apply the filters to the interestedCandidates
//     const filteredCandidates = process.interestedCandidates.filter((candidate) => {
//       // Apply the language and proficiency filter if it exists
//       let matchLang = true;
//       let matchProficiency = true;
//       if (filterConditions.language) {
//         matchLang = filterConditions.language.$elemMatch.lang
//           ? candidate.language.some((l) => l.lang === filterConditions.language.$elemMatch.lang)
//           : true;
//         matchProficiency = filterConditions.language.$elemMatch.proficiencyLevel
//           ? candidate.language.some((l) =>
//               filterConditions.language.$elemMatch.proficiencyLevel.$in.includes(l.proficiencyLevel)
//             )
//           : true;
//       }

//       // Apply the experience filter if it exists
//       let matchExp = true;
//       if (filterConditions.exp) {
//         if (Array.isArray(filterConditions.exp.$in)) {
//           matchExp = filterConditions.exp.$in.includes(candidate.exp);
//         } else if (filterConditions.exp.$gte !== undefined && filterConditions.exp.$lte !== undefined) {
//           matchExp = parseFloat(candidate.exp) >= filterConditions.exp.$gte &&
//             parseFloat(candidate.exp) <= filterConditions.exp.$lte;
//         } else if (filterConditions.exp.$gte !== undefined) {
//           matchExp = parseFloat(candidate.exp) >= filterConditions.exp.$gte;
//         }
//       }

//       return matchLang && matchProficiency && matchExp;
//     });

//     // Convert experience fields from strings to numbers after filtering
//     filteredCandidates.forEach((candidate) => {
//       if (typeof candidate.exp === 'string') {
//         candidate.exp = parseFloat(candidate.exp);
//       }
//     });

//     // Return the filtered candidates
//     res.status(200).json(filteredCandidates);
//   } catch (error) {
//     console.error("Error filtering candidates:", error);
//     res.status(500).json({ message: "Failed to filter candidates", error: error.message });
//   }
// });

// prof and exp are alone not working

// router.get('/filteredCandidatesFilter/:clientId/:processId/:lang?/:proficiencyLevels?/:exp?', async (req, res) => {
//   const { clientId, processId, lang, proficiencyLevels, exp } = req.params;  // Changed from req.query to req.params

//   try {
//     // Find the client by clientId
//     const client = await ClientSheet.findById(clientId);

//     if (!client) {
//       return res.status(404).json({ message: "Client not found" });
//     }

//     // Find the process by processId
//     const process = client.clientProcess.id(processId);

//     if (!process) {
//       return res.status(404).json({ message: "Process not found" });
//     }

//     // Initialize filter conditions for candidates
//     let filterConditions = {};

//     // Handle Language and Proficiency Filter
//     if (lang || proficiencyLevels) {
//       filterConditions.language = { $elemMatch: {} };

//       if (lang) {
//         filterConditions.language.$elemMatch.lang = lang;
//       }

//       if (proficiencyLevels) {
//         const proficiencyLevelsArray = proficiencyLevels.split(","); // Split the comma-separated proficiency levels
//         filterConditions.language.$elemMatch.proficiencyLevel = {
//           $in: proficiencyLevelsArray,
//         };
//       }
//     }

//     // Handle Experience Filter
//     if (exp) {
//       if (exp.toLowerCase() === 'fresher' || exp === '0') {
//         filterConditions.exp = { $in: ['Fresher', 'fresher', '0'] };  // Ensure 0 is treated as a string
//       } else if (exp.includes('-')) {
//         // Handle range filtering like '1-3'
//         const [min, max] = exp.split('-').map(val => parseFloat(val.trim()));

//         if (isNaN(min) || isNaN(max)) {
//           return res.status(400).json({ error: "Invalid experience range format" });
//         }

//         // Ensure numeric comparison
//         filterConditions.exp = {
//           $gte: min,
//           $lte: max,
//         };
//       } else if (exp === '10+') {
//         // Handle '10+' case, filter candidates with experience greater than or equal to 10.1
//         filterConditions.exp = { $gte: 10.1 };
//       }
//     }

//     // Log the constructed filter for debugging
//     console.log("Constructed filter:", JSON.stringify(filterConditions, null, 2));

//     // Apply the filters to the interestedCandidates
//     const filteredCandidates = process.interestedCandidates.filter((candidate) => {
//       // Apply the language and proficiency filter if it exists
//       let matchLang = true;
//       let matchProficiency = true;
//       if (filterConditions.language) {
//         matchLang = filterConditions.language.$elemMatch.lang
//           ? candidate.language.some((l) => l.lang === filterConditions.language.$elemMatch.lang)
//           : true;
//         matchProficiency = filterConditions.language.$elemMatch.proficiencyLevel
//           ? candidate.language.some((l) =>
//               filterConditions.language.$elemMatch.proficiencyLevel.$in.includes(l.proficiencyLevel)
//             )
//           : true;
//       }

//       // Apply the experience filter if it exists
//       let matchExp = true;
//       if (filterConditions.exp) {
//         if (filterConditions.exp.$in) {
//           matchExp = filterConditions.exp.$in.includes(candidate.exp);
//         } else if (filterConditions.exp.$gte !== undefined && filterConditions.exp.$lte !== undefined) {
//           matchExp = parseFloat(candidate.exp) >= filterConditions.exp.$gte &&
//             parseFloat(candidate.exp) <= filterConditions.exp.$lte;
//         } else if (filterConditions.exp.$gte !== undefined) {
//           matchExp = parseFloat(candidate.exp) >= filterConditions.exp.$gte;
//         }
//       }

//       return matchLang && matchProficiency && matchExp;
//     });

//     // Convert experience fields from strings to numbers after filtering
//     filteredCandidates.forEach((candidate) => {
//       if (typeof candidate.exp === 'string') {
//         candidate.exp = parseFloat(candidate.exp);
//       }
//     });

//     // Return the filtered candidates
//     res.status(200).json(filteredCandidates);
//   } catch (error) {
//     console.error("Error filtering candidates:", error);
//     res.status(500).json({ message: "Failed to filter candidates", error: error.message });
//   }
// });

// prof and exp are alone not working
router.get(
  "/filteredCandidatesFilter/:clientId/:processId/:lang?/:proficiencyLevels?/:exp?",
  async (req, res) => {
    const { clientId, processId, lang, proficiencyLevels, exp } = req.params; // Changed from req.query to req.params

    try {
      // Find the client by clientId
      const client = await ClientSheet.findById(clientId);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Find the process by processId
      const process = client.clientProcess.id(processId);

      if (!process) {
        return res.status(404).json({ message: "Process not found" });
      }

      // Initialize filter conditions for candidates
      let filterConditions = {};

      // Handle Language and Proficiency Filter
      if (lang || proficiencyLevels) {
        filterConditions.language = { $elemMatch: {} };

        if (lang) {
          filterConditions.language.$elemMatch.lang = lang;
        }

        if (proficiencyLevels) {
          const proficiencyLevelsArray = proficiencyLevels.split(","); // Split the comma-separated proficiency levels
          filterConditions.language.$elemMatch.proficiencyLevel = {
            $in: proficiencyLevelsArray,
          };
        }
      }

      // Handle Experience Filter
      if (exp) {
        if (exp.toLowerCase() === "fresher" || exp === "0") {
          filterConditions.exp = { $in: ["Fresher", "fresher", "0"] }; // Ensure 0 is treated as a string
        } else if (exp.includes("-")) {
          // Handle range filtering like '1-3'
          const [min, max] = exp
            .split("-")
            .map((val) => parseFloat(val.trim()));

          if (isNaN(min) || isNaN(max)) {
            return res
              .status(400)
              .json({ error: "Invalid experience range format" });
          }

          // Ensure numeric comparison
          filterConditions.exp = {
            $gte: min,
            $lte: max,
          };
        } else if (exp === "10+") {
          // Handle '10+' case, filter candidates with experience greater than or equal to 10.1
          filterConditions.exp = { $gte: 10.1 };
        }
      }

      // Log the constructed filter for debugging
      console.log(
        "Constructed filter:",
        JSON.stringify(filterConditions, null, 2)
      );

      // Apply the filters to the interestedCandidates
      const filteredCandidates = process.interestedCandidates.filter(
        (candidate) => {
          // Apply the language and proficiency filter if it exists
          let matchLang = true;
          let matchProficiency = true;
          if (filterConditions.language) {
            matchLang = filterConditions.language.$elemMatch.lang
              ? candidate.language.some(
                  (l) => l.lang === filterConditions.language.$elemMatch.lang
                )
              : true;
            matchProficiency = filterConditions.language.$elemMatch
              .proficiencyLevel
              ? candidate.language.some((l) =>
                  filterConditions.language.$elemMatch.proficiencyLevel.$in.includes(
                    l.proficiencyLevel
                  )
                )
              : true;
          }

          // Apply the experience filter if it exists
          let matchExp = true;
          if (filterConditions.exp) {
            if (filterConditions.exp.$in) {
              matchExp = filterConditions.exp.$in.includes(candidate.exp);
            } else if (
              filterConditions.exp.$gte !== undefined &&
              filterConditions.exp.$lte !== undefined
            ) {
              matchExp =
                parseFloat(candidate.exp) >= filterConditions.exp.$gte &&
                parseFloat(candidate.exp) <= filterConditions.exp.$lte;
            } else if (filterConditions.exp.$gte !== undefined) {
              matchExp = parseFloat(candidate.exp) >= filterConditions.exp.$gte;
            }
          }

          return matchLang && matchProficiency && matchExp;
        }
      );

      // Convert experience fields from strings to numbers after filtering
      filteredCandidates.forEach((candidate) => {
        if (typeof candidate.exp === "string") {
          candidate.exp = parseFloat(candidate.exp);
        }
      });

      // Return the filtered candidates
      res.status(200).json(filteredCandidates);
    } catch (error) {
      console.error("Error filtering candidates:", error);
      res
        .status(500)
        .json({ message: "Failed to filter candidates", error: error.message });
    }
  }
);

// adding lang and proficiency filter for interested candidate
router.get(
  "/clients/:clientId/process/:processId/interestedlangfilter",
  async (req, res) => {
    const { clientId, processId } = req.params;
    const { lang, proficiencyLevel } = req.query;

    try {
      const client = await ClientSheet.findById(clientId);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const process = client.clientProcess.id(processId);

      if (!process) {
        return res.status(404).json({ message: "Process not found" });
      }

      // Construct the filter for $elemMatch
      let candidateFilter = (candidate) => true;

      if (lang || proficiencyLevel) {
        candidateFilter = (candidate) => {
          const matchLang = lang
            ? candidate.language.some((l) => l.lang === lang)
            : true;
          const matchProficiency = proficiencyLevel
            ? candidate.language.some((l) =>
                proficiencyLevel.split(",").includes(l.proficiencyLevel)
              )
            : true;
          return matchLang && matchProficiency;
        };
      }

      // Filter candidates based on language, proficiency, and interest
      const filteredCandidates = process.interestedCandidates.filter(
        (candidate) => {
          return (
            candidate.interested === "interested" && candidateFilter(candidate)
          );
        }
      );

      res.status(200).json(filteredCandidates);
    } catch (error) {
      console.error("Error filtering candidates:", error);
      res
        .status(500)
        .json({ message: "Failed to filter candidates", error: error.message });
    }
  }
);

// adding lang and proficiency filter for seleted candidate
router.get("/selectedFilter", async (req, res) => {
  const { lang, proficiencyLevel } = req.query;

  try {
    // Fetch all clients
    const clients = await ClientSheet.find({});

    // Initialize an array to store selected candidates with enhanced data
    let selectedCandidates = [];

    // Loop through each client and extract selected candidates with additional fields
    clients.forEach((client) => {
      client.clientProcess.forEach((process) => {
        process.interestedCandidates.forEach((candidate) => {
          if (candidate.status === "selected") {
            // Construct additional fields
            const clientId = client._id;
            const clientProcessId = process._id;
            const clientInfo = `${client.clientName} - ${process.clientProcessName} - ${process.clientProcessLanguage}`;

            // Apply language and proficiency filter
            let matchLang = true;
            let matchProficiency = true;

            if (lang) {
              matchLang = candidate.language.some((l) => l.lang === lang);
            }

            if (proficiencyLevel) {
              matchProficiency = candidate.language.some((l) =>
                proficiencyLevel.split(",").includes(l.proficiencyLevel)
              );
            }

            if (matchLang && matchProficiency) {
              // Add candidate with enhanced data to the response array
              selectedCandidates.push({
                candidate,
                clientId,
                clientProcessId,
                clientInfo,
              });
            }
          }
        });
      });
    });

    // Return the response with selected candidates and additional fields
    res.status(200).json(selectedCandidates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

// router.get(
//   "/clients/:clientId/process/:processId/filterLangFilter",
//   async (req, res) => {
//     const { clientId, processId } = req.params;
//     const { lang, proficiencyLevel } = req.query;

//     try {
//       const client = await ClientSheet.findById(clientId);

//       if (!client) {
//         return res.status(404).json({ message: "Client not found" });
//       }

//       const process = client.clientProcess.id(processId);

//       if (!process) {
//         return res.status(404).json({ message: "Process not found" });
//       }

//       // Construct the filter for $elemMatch
//       let candidateFilter = (candidate) => true;

//       if (lang || proficiencyLevel) {
//         candidateFilter = (candidate) => {
//           const matchLang = lang
//             ? candidate.language.some((l) => l.lang === lang)
//             : true;
//           const matchProficiency = proficiencyLevel
//             ? candidate.language.some((l) =>
//                 proficiencyLevel.split(",").includes(l.proficiencyLevel)
//               )
//             : true;
//           return matchLang && matchProficiency;
//         };
//       }

//       // Filter candidates based on language and proficiency
//       const filteredCandidates = process.interestedCandidates.filter(
//         (candidate) => candidateFilter(candidate)
//       );

//       res.status(200).json(filteredCandidates);
//     } catch (error) {
//       console.error("Error filtering candidates:", error);
//       res
//         .status(500)
//         .json({ message: "Failed to filter candidates", error: error.message });
//     }
//   }
// );
