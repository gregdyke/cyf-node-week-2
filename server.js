const SERVER_PORT = process.env.PORT || 4000;
const express = require("express");
const cors = require("cors");

// get the full list of albums
const albumsData = require("./albums");
const { response } = require("express");

const app = express();

app.use(express.json());
app.use(cors());

// Get an ID number that hasn't already been used in albums
function newID() {
  // Get list of IDs
  let ids = albumsData.map((el) => el.albumId).sort();
  let nextId = 1;
  // check if id string is taken
  while (ids.includes(`${nextId}`)) {
    nextId++;
  }
  return String(nextId);
}

app.get("/albums", (request, response) => {
  response.status(200).send(albumsData);
});

function getForbiddenKeys(query, allowedKeys) {
  const keys = Object.keys(query);
  return keys.filter((key) => !allowedKeys.includes(key));
}

// e.g. /albums/search?artistName=Beyoncé&primaryGenreName=Pop
// careful to place /albums/search before /albums/:id
app.get("/albums/search", (req, res) => {
  const allowedSearchKeys = [
    "primaryGenreName",
    "artistName",
    "collectionName",
  ];

  const forbiddenKeys = getForbiddenKeys(req.query, allowedSearchKeys);
  if (forbiddenKeys.length > 0) {
    // using return here exits the handler as we are not
    // allowed to execute any more code after sending the response
    return res
      .status(400)
      .send(
        `The following keys are forbidden: '${forbiddenKeys.join("', '")}'`
      );
  }

  let searchResult = albumsData; // start with all results

  allowedSearchKeys
    .filter((searchKey) => req.query[searchKey] !== undefined) // is the key present in the query?
    .forEach((searchKey) => {
      // for each key that is present, progressively filter out the results that don't match
      searchResult = searchResult.filter(
        (album) => album[searchKey] === req.query[searchKey]
      );
    });

  //   // the above filter + forEach is equalent to
  //
  //   if (req.query.primaryGenreName !== undefined) {
  //     searchResult = searchResult.filter(
  //       (album) => (album.primaryGenreName = req.query.primaryGenreName)
  //     );
  //   }

  //   if (req.query.artistName !== undefined) {
  //     searchResult = searchResult.filter(
  //       (album) => (album.artistName = req.query.artistName)
  //     );
  //   }
  //
  //   // etc.

  res.status(200).send(searchResult);
});

app.get("/albums/:id", (req, res) => {
  const albumById = albumsData.find((album) => album.albumId === req.params.id);
  if (albumById === undefined) {
    res.sendStatus(404);
  } else {
    res.send(albumById);
  }
});

function validateAlbum(album) {
  // should check a bunch more things if we are thorough
  return album.artistName !== undefined;
}

app.post("/albums", (req, res) => {
  const newAlbum = req.body;
  if (!validateAlbum(newAlbum)) {
    res.status(400).send("album is not valid"); // ideally could provide more detail
  } else {
    newAlbum.albumId = newID();
    albumsData.push(newAlbum);
    res.sendStatus(201);
  }
});

app.delete("/albums/:id", (req, res) => {
  const albumId = req.params.id;
  const albumIndex = albumsData.findIndex((album) => album.albumId === albumId);
  if (albumIndex > 0) {
    albumsData.splice(albumIndex, 1); // remove album at index albumIndex from array
    res.sendStatus(204);
  } else {
    res.status(404).send("Could not find album with id " + albumId);
  }
});

app.put("/albums/:id", (req, res) => {
  const albumId = req.params.id;
  const updatedAlbum = req.body;
  const albumIndex = albumsData.findIndex((album) => album.albumId === albumId);
  if (updatedAlbum.albumId !== albumId) {
    res.status(400).send("Can't change id of album");
  } else if (!validateAlbum(updatedAlbum)) {
    res.status(400).send("updated album is not valid"); // ideally could provide more detail
  } else if (albumIndex > 0) {
    albumsData[albumIndex] = updatedAlbum;
    res.sendStatus(204);
  } else {
    res.status(404).send("Could not find album with id " + albumId);
  }
});

app.listen(SERVER_PORT, () => console.log(`Server running on ${SERVER_PORT}`));
