import { CurrentUser, UserComment } from "./types";

const API_URL = import.meta.env.VITE_API_URL;

const fetchData = async (api: string) => {
  const res = await fetch(`${API_URL}/${api}`);
  if (!res.ok) throw new Error(`Unable to fetch ${api}`);
  return res.json();
};

const renderComment = (data: UserComment, parentId: number = 0): string => {
  if (!data.user || !data.user.image || !data.user.username) {
    console.error("Invalid user data:", data);
    return `<div>Error: Invalid user data</div>`;
  }

  return `
    <div class="bg-white md:gap-5 p-4 md:p-6 rounded-lg md:flex shadow-md mb-4">
        <div class="hidden md:block">${renderVote(data, parentId)}</div>
        <div class="flex gap-6 items-center w-full">
            <div class="flex flex-col w-full">
                <div class="flex items-center justify-between">
                    <div class="flex gap-4 items-center">
                        <img width="40" src="${data.user.image.png}" alt="${data.user.username}">
                        <h3 class="text-blue-800 text-lg md:text-xl font-bold">${data.user.username}</h3>
                        ${data.user.username === "juliusomo" ? '<p class="text-white text-sm bg-blue-700 font-medium px-2 pb-0.5 rounded-sm">you</p>' : ""}
                        <p class="text-gray-400 text-sm font-medium">${data.createdAt}</p>
                    </div>
                    <div class="hidden md:flex">${renderCTA("juliusomo", data, parentId)}</div>
                </div>
                <p class="py-4">${data.replyingTo ? `<span class="text-blue-700 font-bold">@${data?.replyingTo}</span>` : ""} ${data.content}</p>
            </div>
        </div>
        <div class="text-blue-700 bg-red-500 flex justify-between md:hidden">
            ${renderVote(data, parentId)}
            ${renderCTA("juliusomo", data, parentId)}
        </div>
    </div>`;
};

const renderVote = (data: UserComment, parentId: number = 0): string =>
  `<div class="bg-gray-200 items-center max-h-24 text-blue-600 flex md:flex-col md:gap-2 gap-4 px-3 max-md:py-2 md:pb-1 font-bold rounded-md">
        <span class="vote-button" data-action="increase-vote" data-id="${data.id}" data-parent-id="${parentId}">+</span>
        <span class="text-blue-700">${data.score}</span>
        <span class="vote-button" data-action="decrease-vote" data-id="${data.id}" data-parent-id="${parentId}">-</span>
    </div>`;

const addNewComment = async (): Promise<string> => {
  const user = (await fetchData("currentUser")) as CurrentUser;

  return `<div class="py-4"><div class="bg-white p-4 flex gap-3 md:p-6 rounded-lg shadow-md">
        <div><img width="40" src="${user.image.png}" alt="${user.username}"/></div>
        <textarea type="text" name="reply" placeholder="Add a comment" class="reply-textarea border min-h-24 resize-none p-2 outline-0 w-full rounded-md border-gray-200"></textarea>
        <button class="send-button" data-action="send">Send</button>
    </div></div>`;
};

const renderReply = async (
  btn: string,
  commentId: number = 0, // TODO: Why is it not used? (Send Reply)
): Promise<string> => {
  const user = (await fetchData("currentUser")) as CurrentUser;

  return `<div class="${btn === "Send" ? "py-4" : "mb-4 reply"}"><div class="bg-white p-4 flex gap-3 md:p-6 rounded-lg shadow-md">
        <div><img width="40" src="${user.image.png}" alt="${user.username}"/></div>
        <textarea type="text" name="reply" placeholder="Add a comment" class="reply-textarea border min-h-24 resize-none p-2 outline-0 w-full rounded-md border-gray-200"></textarea>
        <button class="reply-btn bg-blue-700 text-white font-medium md:text-lg max-h-10 rounded-lg px-4 py-1">${btn}</button>
    </div></div>`;
};

const addComment = async () => {
  const textarea = document.querySelector(
    ".reply-textarea",
  ) as HTMLTextAreaElement;
  if (!textarea) throw new Error("Textarea not found");

  const content = textarea.value;
  const user = (await fetchData("currentUser")) as CurrentUser;
  const userId = (await getLastId()) + 1;

  const comment: UserComment = {
    id: userId,
    content,
    createdAt: "Today",
    score: 0,
    user,
    replies: [],
  };
  const res = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(comment),
  });

  if (!res.ok) throw new Error("Unable to add new comment");
};

const addCommentReply = async (commentId: number) => {
  // TODO: Why is it yet to be used?
  const textarea = document.querySelector(
    ".reply-textarea",
  ) as HTMLTextAreaElement;
  if (!textarea) throw new Error("Textarea not found");

  const content = textarea.value;
  const user = (await fetchData("currentUser")) as CurrentUser;
  const userId = (await getLastId()) + 1;

  const comment = await fetchData(`comments/${commentId}`);
  const username = comment.user.username;

  const reply: UserComment = {
    id: userId,
    content,
    createdAt: "Today",
    score: 0,
    user,
    replies: [],
    replyingTo: username,
  };
  // Add logic to handle posting the reply
};

const getLastId = async (): Promise<number> => {
  const comments = (await fetchData("comments")) as UserComment[];
  const allIds: number[] = [];
  comments.map((comment: any) => {
    allIds.push(comment.id as number);
    comment.replies.map((reply: any) => allIds.push(reply.id as number));
  });

  return Math.max(...allIds);
};

const vote = async (id: number, op: "+" | "-", parentId: number) => {
  const userId = parentId !== 0 ? parentId : id;
  const comment = (await fetchData(`comments/${userId}`)) as UserComment;

  if (!parentId)
    comment.score = op === "+" ? comment.score + 1 : comment.score - 1;
  else {
    const replyIndex = comment.replies.findIndex((reply) => reply.id === id);
    const newScore =
      op === "+"
        ? comment.replies[replyIndex].score + 1
        : comment.replies[replyIndex].score - 1;

    if (replyIndex !== -1) comment.replies[replyIndex].score = newScore;
  }

  const updateComment = await fetch(`${API_URL}/comments/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...comment }),
  });
  if (!updateComment.ok)
    throw new Error(`Unable to increase comment score with id ${id}`);
};

const showReply = async (id: number) => {
  // Remove any existing reply box
  const existingReplyBox = Array.from(
    document.querySelectorAll("div.reply"),
  ).find(
    (element) => element.textContent && element.textContent.includes("Reply"),
  );
  if (existingReplyBox) {
    existingReplyBox.previousElementSibling
      ?.querySelector(".show-reply")
      ?.removeAttribute("disabled");
    existingReplyBox.remove();
  }

  // Find the comment element that was clicked
  const commentElement = document.querySelectorAll("div.bg-white.p-4")[id - 1];
  // console.log(commentElement)

  // Toggle the reply element
  const replyHTML = await renderReply("Reply", id);
  commentElement.insertAdjacentHTML("afterend", replyHTML);
  commentElement?.querySelector(".show-reply")?.setAttribute("disabled", "");
};

const delPopUp = (id: number, parentId: number): string =>
  `<div id="overlay" class="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
        <div class="bg-white w-2/3 md:w-1/3 p-6 rounded-lg shadow-md">
            <h2 class="text-lg font-bold mb-4">Delete Comment</h2>
            <p class="mb-6">Are you sure you want to delete this comment? This will remove the comment and can't be undone.</p>
            <div class="flex gap-4 *:text-white *:uppercase *:text-sm *:font-medium">
                <button class="cancel-button" data-action="cancel">No, Cancel</button>
                <button class="confirm-button" data-action="confirm" data-id="${id}" data-parent-id="${parentId}">Yes, Delete</button>
            </div>
        </div>
    </div>`;

const closePopup = () => {
  const overlay = document.getElementById("overlay");
  if (overlay) overlay.remove();
};

const renderCTA = (
  user: string,
  data: UserComment,
  parentId: number,
): string =>
  data.user.username !== user
    ? `<button class="flex items-center gap-2 show-reply" data-action="reply" data-id="${data.id}">
        <div><img src="./images/icon-reply.svg" alt="icon-reply"></div>
        <p>Reply</p>
        </button>`
    : `<div class="flex items-center gap-4">
        <button class="flex items-center gap-2 delete-button" data-action="delete" data-id="${data.id}" data-parent-id="${parentId}">
            <div><img src="./images/icon-delete.svg" alt="icon-delete"></div>
            <p>Delete</p>
        </button>
        <button class="flex items-center gap-2 edit-button" data-action="edit" data-id="${data.id}" data-parent-id="${parentId}">
            <div><img src="./images/icon-edit.svg" alt="icon-edit"></div>
            <p>Edit</p>
        </button>
    </div>`;

const showDelPopUp = (id: number, parentId: number) =>
  document.body.insertAdjacentHTML("beforeend", delPopUp(id, parentId));

const deleteComment = async (id: number, parentId: number) => {
  const userId = parentId !== 0 ? parentId : id;

  if (!parentId) {
    const res = await fetch(`${API_URL}/comments/${userId}`, {
      method: "DELETE",
    });
    if (!res.ok)
      throw new Error(`Unable to delete comment with userId: ${userId}`);
  } else {
    // Remove reply with id from comment
    const comment = (await fetchData(`comments/${parentId}`)) as UserComment;

    const replyIndex = comment.replies.findIndex((reply) => reply.id === id);
    if (replyIndex !== -1) comment.replies.splice(replyIndex, 1);

    const updateComment = await fetch(`${API_URL}/comments/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...comment }),
    });
    if (!updateComment.ok)
      throw new Error(`Unable to update comment with id ${id}`);
  }

  closePopup();
};

const editComment = async (id: number, parentId: number) => {
  // Implement edit logic here  <div></div>
  const commentElement = document.querySelectorAll("div.bg-white.p-4")[id - 1];
  const commentTextElement = commentElement.querySelector(".py-4");

  if (!commentTextElement)
    throw new Error("Text element within the comment not found");

  const commentText = commentTextElement.textContent;
  commentTextElement.innerHTML = `
    <textarea type="text" name="reply" placeholder="Add a comment" class="reply-textarea border min-h-24 resize-none p-2 outline-0 w-full rounded-md border-gray-200">${commentText}</textarea>
    <button class="send-button" data-action="send">Send</button>
  `;
};

// Display Contents in DOM
const body = document.querySelector("body");

const displayContents = async () => {
  if (!body) throw new Error("Body element not found");

  let comments = (await fetchData("comments")) as UserComment[];
  comments = comments.sort((a, b) => b.score - a.score);

  const commentsHTML = comments
    .map(
      (comment) => `
          ${renderComment(comment)}
          ${
            comment.replies.length > 0
              ? `<div class="pl-4 ml-4 border-0 border-l-2 border-l-gray-200">
              ${comment?.replies.map((reply) => renderComment(reply, comment.id)).join("")}
          </div>`
              : ""
          }
      `,
    )
    .join("");

  const addCommentHtml = await addNewComment();
  body.innerHTML = commentsHTML + addCommentHtml;
};

displayContents();

body?.addEventListener("click", (event) => {
  event.preventDefault();

  const target = event.target as HTMLElement;
  const button = target.closest("[data-action]");

  if (!(button instanceof HTMLElement)) return;

  const { id, action, parentId } = button.dataset;

  switch (action) {
    case "reply":
      showReply(Number(id));
      break;
    case "edit":
      editComment(Number(id), Number(parentId));
      break;
    case "delete":
      showDelPopUp(Number(id), Number(parentId));
      break;
    case "send":
      addComment();
      break;
    case "increase-vote":
      vote(Number(id), "+", Number(parentId));
      break;
    case "decrease-vote":
      vote(Number(id), "-", Number(parentId));
      break;
    case "cancel":
      closePopup();
      break;
    case "confirm":
      deleteComment(Number(id), Number(parentId));
      break;
  }
});
