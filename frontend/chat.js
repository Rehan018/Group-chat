let chatForm = document.getElementById("chat-form");
let chatBox = document.getElementById("message-box");
let friendName = document.getElementById("friend-name");

chatForm.addEventListener("submit", sendMessage);

async function sendMessage(event) {
  event.preventDefault();

  let formObj = new FormData(chatForm);
  let message = {};

  for (const [key, value] of formObj) {
    message[key] = value;
  }

  let to = localStorage.getItem("chat");
  if (to === undefined) {
    alert("Please Select Friend");
    window.location = "./friend.html";
  }

  message["to"] = to;
  let res = await axios({
    method: "post",
    url: api + "message",
    data: message,
  });
}

window.addEventListener("DOMContentLoaded", getAllMessages);

// Global Variable to indicate message inside DOM so we ignore this message
let lastIndex = 0;

function appendMessageToChatBox(message, isCurrentUser) {
  let structure = `
    <div class="col col-12 ${isCurrentUser ? 'text-end bg-chat' : ''} p-2">
        ${message}
    </div>
  `;

  let ele = document.createElement("div");
  ele.setAttribute("class", "row");
  ele.innerHTML = structure;
  chatBox.appendChild(ele);
}

function getAllMessages(event) {
  let to = localStorage.getItem("chat");
  let store = JSON.parse(localStorage.getItem("message"));

  if (store) {
    for (const sender of store) {
      if (Number(sender.to) === Number(to)) {
        lastIndex = sender["messages"].at(-1).id;
        for (const d of sender["messages"]) {
          if (Number(d.toUser) === Number(to)) {
            appendMessageToChatBox(d.message, true);
          } else {
            appendMessageToChatBox(d.message, false);
          }
        }
      }
    }
  }

  setInterval(() => {
    fromBackend();
  }, 1000);
}

async function fromBackend() {
  let to = localStorage.getItem("chat");

  try {
    let res = await axios({
      method: "post",
      url: api + "message/all",
      data: { to: to, skip: lastIndex },
    });

    let data = res.data.data.message;
    let user = res.data.data.user;

    if (data.length > 0) {
      let getMessages = localStorage.getItem("message");

      if (getMessages) {
        let arr = JSON.parse(getMessages);
        let flag = true;

        for (const d of arr) {
          if (Number(d.to) === Number(to)) {
            for (const dd of data) {
              d["messages"].push(dd);
              if (d["messages"].length > 10) {
                d["messages"].shift();
              }
              flag = false;
            }
          }
        }

        if (flag === true) {
          obj = {};
          obj["messages"] = [];
          obj["to"] = to;

          let length = data.length;

          for (const d of data) {
            if (length < 10) {
              obj["messages"].push(d);
            }
            length--;
          }

          arr.push(obj);
        }

        localStorage.setItem("message", JSON.stringify(arr));
      } else {
        let arr = [];
        obj = {};
        obj["messages"] = [];
        obj["to"] = to;

        let length = data.length;

        for (const d of data) {
          if (length < 10) {
            obj["messages"].push(d);
          }
          length--;
        }

        arr.push(obj);
        localStorage.setItem("message", JSON.stringify(arr));
      }
    }

    for (const d of data) {
      if (d.toUser === Number(to)) {
        appendMessageToChatBox(d.message, true);
      } else {
        appendMessageToChatBox(d.message, false);
      }
      lastIndex = d.id;
    }
  } catch (err) {
    console.log(err);
  }
}
