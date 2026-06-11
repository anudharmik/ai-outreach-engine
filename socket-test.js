const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected");
});

socket.on("jobCompleted", (data) => {
  console.log("Job Finished:");
  console.log(data);
});
