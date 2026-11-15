// ============================================================
//  routes/groupRoutes.js
//  5️⃣  HTTP Methods: POST, GET, PATCH, DELETE
// ============================================================

const router = require("express").Router();
const {
  createGroup,
  joinGroup,
  getGroup,
  lockGroup,
  removeGroup,
  getAllGroups,
} = require("../controllers/groupController");

// POST   /group/create         — create a new group order
// POST   /group/join           — join using group code
// GET    /group                — list all groups (debug)
// GET    /group/:code          — get group details
// PATCH  /group/lock           — manually lock a group
// DELETE /group/:code          — delete a group

router.post  ("/create",  createGroup);
router.post  ("/join",    joinGroup);
router.get   ("/",        getAllGroups);
router.get   ("/:code",   getGroup);
router.patch ("/lock",    lockGroup);
router.delete("/:code",   removeGroup);

module.exports = router;
