import { CurrentUser, UserComment } from "./types";

const API_URL = import.meta.env.VITE_API_URL;

const fetchData = async (endpoint: string) => {
  const res = await fetch(`${API_URL}/${endpoint}`);
  if (!res.ok) throw new Error(`Unable to fetch ${endpoint}`);
  return res.json();
};

const currentUser = (await fetchData("currentUser")) as CurrentUser;

const renderComment = (data: UserComment, parentId: number = 0): string => {
  if (!data.user || !data.user.image || !data.user.username) {
    console.error("Invalid user data:", data);
    return `<div>Error: Invalid user data</div>`;
  }

  return `
    <div class="comment">
        <div class="hidden md:block">${renderVote(data.id, data.score, parentId)}</div>
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
            ${renderVote(data.id, data.score, parentId)}
            ${renderCTA("juliusomo", data, parentId)}
        </div>
    </div>`;
};

const renderVote = (id: number, score: number, parentId: number = 0): string =>
  `<div class="bg-gray-200 items-center max-h-24 text-blue-600 flex md:flex-col md:gap-2 gap-4 px-3 max-md:py-2 md:pb-1 font-bold rounded-md">
        <span class="vote-button" data-action="increase-vote" data-id="${id}" data-parent-id="${parentId}">+</span>
        <span class="text-blue-700">${score}</span>
        <span class="vote-button" data-action="decrease-vote" data-id="${id}" data-parent-id="${parentId}">-</span>
    </div>`;

const addComment = async () => {
  const textarea = document.querySelector(
    ".send-comment",
  ) as HTMLTextAreaElement;

  if (!textarea.value) return;

  const userId = (await getLastId()) + 1;

  const comment: UserComment = {
    id: userId,
    content: textarea.value,
    createdAt: "Today",
    score: 0,
    user: currentUser,
    replies: [],
  };

  const res = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(comment),
  });

  if (!res.ok) throw new Error("Unable to add new comment");
};

const addCommentReply = async (id: number, parentId: number) => {
  const textarea = document.querySelector(
    ".reply-textarea",
  ) as HTMLTextAreaElement;

  if (!textarea.value.trim()) return;

  const replyId = (await getLastId()) + 1;
  const comment = (await fetchData(
    `comments/${parentId ? parentId : id}`,
  )) as UserComment;
  const reply = {
    id: replyId,
    content: textarea.value,
    createdAt: "Today",
    score: 0,
    user: currentUser,
    replies: [],
    replyingTo: comment.user.username,
  };

  if (parentId) {
    const commentReply = comment.replies.find((reply) => reply.id === id);
    reply.replyingTo = commentReply?.user.username as string
  }

  comment.replies.push(reply);

  const updateComment = await fetch(
    `${API_URL}/comments/${parentId ? parentId : id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...comment }),
    },
  );
  if (!updateComment.ok)
    throw new Error(`Unable to increase comment score with id ${id}`);
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

const showReply = (button: Element, id: number, parentId: number = 0) => {
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

  // Find the comment element with the reply button that was clicked
  const commentElement = button.closest(".comment") as Element;

  // Toggle the reply element
  const replyHTML = `<div class="mb-4 reply"><div class="bg-white p-4 flex gap-3 md:p-6 rounded-lg shadow-md">
        <div><img width="40" src="${currentUser.image.png}" alt="${currentUser.username}"/></div>
        <textarea type="text" name="reply" placeholder="Add comment" class="reply-textarea"></textarea>
        <button class="reply-button" data-action="reply-comment" data-id="${id}" data-parent-id="${parentId}">Reply</button>
    </div></div>`;
  commentElement.insertAdjacentHTML("afterend", replyHTML);
  commentElement?.querySelector(".show-reply")?.setAttribute("disabled", "");
};

const deletePopUp = (id: number, parentId: number) => {
  const deletePopUpHTML = `<div id="overlay" class="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
        <div class="bg-white w-2/3 md:w-1/3 p-6 rounded-lg shadow-md">
            <h2 class="text-lg font-bold mb-4">Delete Comment</h2>
            <p class="mb-6">Are you sure you want to delete this comment? This will remove the comment and can't be undone.</p>
            <div class="flex gap-4 *:text-white *:uppercase *:text-sm *:font-medium">
                <button class="cancel-button" data-action="cancel">No, Cancel</button>
                <button class="confirm-button" data-action="confirm" data-id="${id}" data-parent-id="${parentId}">Yes, Delete</button>
            </div>
        </div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", deletePopUpHTML);
};

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
    ? `<button class="flex items-center gap-2 show-reply" data-action="reply" data-id="${data.id}" data-parent-id="${parentId}">
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

const deleteComment = async (id: number, parentId: number) => {
  if (!parentId) {
    const res = await fetch(`${API_URL}/comments/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`Unable to delete comment with id: ${id}`);
  } else {
    // Remove reply with id from comment
    const comment = (await fetchData(`comments/${parentId}`)) as UserComment;

    const replyIndex = comment.replies.findIndex((reply) => reply.id === id);
    if (replyIndex !== -1) comment.replies.splice(replyIndex, 1);

    const updateComment = await fetch(`${API_URL}/comments/${parentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...comment }),
    });
    if (!updateComment.ok)
      throw new Error(`Unable to update comment with id ${id}`);
  }

  closePopup();
};

const updateComment = async (button: Element, id: number, parentId: number) => {
  const textarea = button.parentElement
    ?.previousElementSibling as HTMLTextAreaElement;
  const value = textarea.value.trim();

  if (!value || value == localStorage?.getItem("comment")) {
    removeEditTextarea(textarea);
    return;
  }

  if (parentId) {
    const comment = (await fetchData(`comments/${parentId}`)) as UserComment;
    const replyIndex = comment.replies.findIndex((reply) => reply.id === id);
    const words = value.split(" ");
    comment.replies[replyIndex].replyingTo = words[0].slice(1);
    comment.replies[replyIndex].content = words.slice(1).join(" ");
    const updateComment = await fetch(`${API_URL}/comments/${parentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...comment }),
    });
    if (!updateComment.ok)
      throw new Error(`Unable to update comment with id ${id}`);
  } else {
    const updateComment = await fetch(`${API_URL}/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: textarea.value }),
    });
    if (!updateComment.ok)
      throw new Error(`Unable to update comment with id ${id}`);
  }
};

const removeEditTextarea = (textarea: Element) => {
  const words = textarea.textContent.split(" ");
  const container = textarea.parentElement as HTMLElement;
  container.innerHTML = `${words.length > 1 ? `<span class="text-blue-700 font-bold">${words[0].trim()} </span>` : ""}${words.length > 1 ? words.slice(1).join(" ") : words[0].trim()}`;
  container.parentElement
    ?.querySelector(".edit-button")
    ?.removeAttribute("disabled");
};

const editComment = (button: Element, id: number, parentId: number) => {
  // Remove any existing textarea
  const existingTextarea = document.querySelector("textarea.edit-textarea");
  if (existingTextarea) removeEditTextarea(existingTextarea);

  const comment = button.closest(".comment") as Element;
  const commentTextElement = comment.querySelector(".py-4") as Element;

  localStorage.setItem("comment", commentTextElement.textContent.trim());

  button?.setAttribute("disabled", "");
  commentTextElement.innerHTML = `
    <textarea type="text" name="reply" placeholder="Edit comment" class="edit-textarea">${commentTextElement.textContent.trim()}</textarea>
    <div class="flex justify-end pt-3">
      <button class="send-button" data-id="${id}" data-parent-id="${parentId}" data-action="edit-comment">Update</button>
    </div>
  `;
};

// Display Contents in DOM
const body = document.querySelector("body") as HTMLBodyElement;
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

const addCommentHtml = `<div class="py-4"><div class="bg-white p-4 flex gap-3 md:p-6 rounded-lg shadow-md">
        <div><img width="40" src="${currentUser.image.png}" alt="${currentUser.username}"/></div>
        <textarea type="text" name="reply" placeholder="Add comment" class="send-comment"></textarea>
        <button class="send-button" data-action="send">Send</button>
    </div></div>`;
body.innerHTML = commentsHTML + addCommentHtml;

body?.addEventListener("click", (event) => {
  event.preventDefault();

  const target = event.target as HTMLElement;
  const button = target.closest("[data-action]");

  if (!(button instanceof HTMLElement)) return;

  const id = Number(button.dataset.id);
  const parentId = Number(button.dataset.parentId);

  switch (button.dataset.action) {
    case "reply":
      showReply(button, id, parentId);
      break;
    case "edit":
      editComment(button, id, parentId);
      break;
    case "edit-comment":
      updateComment(button, id, parentId);
      break;
    case "delete":
      deletePopUp(id, parentId);
      break;
    case "send":
      addComment();
      break;
    case "increase-vote":
      vote(id, "+", parentId);
      break;
    case "decrease-vote":
      vote(id, "-", parentId);
      break;
    case "cancel":
      closePopup();
      break;
    case "confirm":
      deleteComment(id, parentId);
      break;
    case "reply-comment":
      addCommentReply(id, parentId);
      break;
  }
});
