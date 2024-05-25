var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const portNo = 3000;
const fetchData = (api) => __awaiter(this, void 0, void 0, function* () {
    const res = yield fetch(`http://localhost:${portNo}/${api}`);
    if (!res.ok)
        throw new Error(`Unable to fetch ${api}`);
    return (yield res.json());
});
const processComments = (comments) => {
    return comments.map(comment => (Object.assign(Object.assign({}, comment), { id: Number(comment.id), replies: comment.replies ? processComments(comment.replies) : [] })));
};
const renderComment = (data, parentId = 0) => {
    if (!data.user || !data.user.image || !data.user.username) {
        console.error('Invalid user data:', data);
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
                        <h3 class="text-[#324152] text-lg md:text-xl font-bold">${data.user.username}</h3>
                        ${data.user.username === 'juliusomo' ? '<p class="text-white text-sm bg-[#5457B6] font-medium px-2 pb-0.5 rounded-sm">you</p>' : ''}
                        <p class="text-[#67727e] text-sm font-medium">${data.createdAt}</p>
                    </div>
                    <div class="hidden md:flex">${renderCTA('juliusomo', data, parentId)}</div>
                </div>
                <p class="py-4">${data.replyingTo ? `<span class="text-[#5457b6] font-bold">@${data.replyingTo}</span>` : ''} ${data.content}</p>
            </div>
        </div>
        <div class="text-[#5457B6] flex justify-between md:hidden">
            ${renderVote(data, parentId)}
            ${renderCTA('juliusomo', data, parentId)}
        </div>
    </div>`;
};
const renderVote = (data, parentId = 0) => `<div class="bg-[#eaecf1] items-center max-h-24 text-[#c3c4ef] flex md:flex-col md:gap-2 gap-4 px-3 max-md:py-2 md:pb-1 font-bold rounded-md">
        <span class="cursor-pointer hover:text-[#5457B6]" onclick="vote(${data.id}, '+', ${parentId})">+</span>
        <span class="text-[#5457B6]">${data.score}</span>
        <span class="cursor-pointer hover:text-[#5457B6]" onclick="vote(${data.id}, '-', ${parentId})">-</span>
    </div>`;
const renderReply = (btn_1, ...args_1) => __awaiter(this, [btn_1, ...args_1], void 0, function* (btn, commentId = 0) {
    const user = yield fetchData('currentUser');
    return `<div class="${btn === 'Send' ? 'py-4' : 'mb-4 reply'}"><div class="bg-white p-4 flex gap-3 md:p-6 rounded-lg shadow-md">
        <div class=""><img width="40" src="${user.image.png}" alt="${user.username}"/></div>
        <textarea type="text" name="reply" placeholder="Add a comment" class="reply-textarea border min-h-24 resize-none p-2 outline-0 w-full rounded-md border-[#eaecf1]"></textarea>
        <button class="reply-btn bg-[#5457B6] text-white font-medium md:text-lg max-h-10 rounded-lg px-4 py-1">${btn}</button>
    </div></div>`;
});
const addComment = () => __awaiter(this, void 0, void 0, function* () {
    const textarea = document.querySelector('.reply-textarea');
    if (!textarea)
        throw new Error("Textarea not found");
    const content = textarea.value;
    const user = yield fetchData('currentUser');
    const userId = (yield getLastId()) + 1;
    const comment = { id: userId, content, createdAt: 'Today', score: 0, user, replies: [] };
    const res = yield fetch(`http://localhost:${portNo}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment)
    });
    if (!res.ok)
        throw new Error("Unable to add new comment");
});
const addCommentReply = (commentId) => __awaiter(this, void 0, void 0, function* () {
    const textarea = document.querySelector('.reply-textarea');
    if (!textarea)
        throw new Error("Textarea not found");
    const content = textarea.value;
    const user = yield fetchData('currentUser');
    const userId = (yield getLastId()) + 1;
    const comment = yield fetchData(`comments/${commentId}`);
    const username = comment.user.username;
    const reply = { id: userId, content, createdAt: 'Today', score: 0, user, replies: [], replyingTo: username };
    // Add logic to handle posting the reply
});
const getLastId = () => __awaiter(this, void 0, void 0, function* () {
    const comments = yield fetchData('comments');
    const allIds = [];
    comments.map((comment) => {
        allIds.push(comment.id);
        comment.replies.map((reply) => allIds.push(reply.id));
    });
    return Math.max(...allIds);
});
const vote = (id, op, parentId) => __awaiter(this, void 0, void 0, function* () {
    const userId = parentId !== 0 ? parentId : id;
    const comment = yield fetchData(`comments/${userId}`);
    if (!parentId)
        comment.score = op === '+' ? comment.score + 1 : comment.score - 1;
    else {
        const replyIndex = comment.replies.findIndex(reply => reply.id === id);
        const newScore = op === '+' ? comment.replies[replyIndex].score + 1 : comment.replies[replyIndex].score - 1;
        if (replyIndex !== -1)
            comment.replies[replyIndex].score = newScore;
    }
    const updateComment = yield fetch(`http://localhost:${portNo}/comments/${userId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({}, comment))
    });
    if (!updateComment.ok)
        throw new Error(`Unable to increase comment score with id ${id}`);
});
const showReply = (id) => __awaiter(this, void 0, void 0, function* () {
    // Remove any existing reply box
    const existingReplyBox = Array.from(document.querySelectorAll('div.reply')).find(element => element.textContent && element.textContent.includes('Update'));
    if (existingReplyBox)
        existingReplyBox.remove();
    // Find the comment element that was clicked
    const commentElement = document.querySelectorAll('div.bg-white.p-4')[id - 1];
    const existingReplyElement = commentElement.nextElementSibling;
    // Toggle the reply element
    if (!existingReplyElement || !existingReplyElement.classList.contains('reply')) {
        const replyHTML = yield renderReply('Update', id);
        commentElement.insertAdjacentHTML('afterend', replyHTML);
    }
});
const delPopUp = (id, parentId) => `<div id="overlay" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div class="bg-white w-2/3 md:w-1/4 p-6 rounded-lg shadow-md">
            <h2 class="text-lg font-bold mb-4">Delete Comment</h2>
            <p class="mb-6">Are you sure you want to delete this comment? This will remove the comment and can't be undone.</p>
            <div class="flex gap-4 *:text-white *:uppercase *:text-sm *:font-medium">
                <button onclick="closePopup()" class="bg-[#324152] hover:bg-[#67727e] px-4 py-2 rounded-md">No, Cancel</button>
                <button onclick="deleteComment(${id}, ${parentId})" class="bg-[#ed6468] hover:bg-[#ffb8bb] px-4 py-2 rounded-md">Yes, Delete</button>
            </div>
        </div>
    </div>`;
const closePopup = () => {
    const overlay = document.getElementById('overlay');
    if (overlay)
        overlay.remove();
};
const renderCTA = (user, data, parentId) => data.user.username !== user ? `<div class="flex items-center gap-2">
        <div><img src="./images/icon-reply.svg" alt="icon-reply"></div>
        <p class="text-sm cursor-pointer font-bold text-[#5457B6] hover:text-[#c3c4ef]" onclick="showReply(${data.id})">Reply</p>
        </div>` :
    `<div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
            <div><img src="./images/icon-delete.svg" alt="icon-delete"></div>
            <p class="text-sm cursor-pointer font-bold text-[#ed6468] hover:text-[#ffb8bb]" onclick="showDelPopUp(${data.id}, ${parentId})">Delete</p>
        </div>
        <div class="flex items-center gap-2">
            <div><img src="./images/icon-edit.svg" alt="icon-edit"></div>
            <p class="text-sm cursor-pointer font-bold text-[#5457B6] hover:text-[#c3c4ef]" onclick="editComment(${data.id}, ${parentId})">Edit</p>
        </div>
    </div>`;
const showDelPopUp = (id, parentId) => document.body.insertAdjacentHTML('beforeend', delPopUp(id, parentId));
const deleteComment = (id, parentId) => __awaiter(this, void 0, void 0, function* () {
    const userId = parentId !== 0 ? parentId : id;
    if (!parentId) {
        const res = yield fetch(`http://localhost:${portNo}/comments/${userId}`, { method: 'DELETE' });
        if (!res.ok)
            throw new Error(`Unable to delete comment with userId: ${userId}`);
    }
    else {
        // Remove reply with id from comment
        const comment = yield fetchData(`comments/${parentId}`);
        const replyIndex = comment.replies.findIndex(reply => reply.id === id);
        if (replyIndex !== -1)
            comment.replies.splice(replyIndex, 1);
        const updateComment = yield fetch(`http://localhost:${portNo}/comments/${userId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.assign({}, comment))
        });
        if (!updateComment.ok)
            throw new Error(`Unable to update comment with id ${id}`);
    }
    closePopup();
});
const editComment = (id, parentId) => __awaiter(this, void 0, void 0, function* () {
    // Implement edit logic here  <div></div>
    const commentElement = document.querySelectorAll('div.bg-white.p-4')[id - 1];
    const commentTextElement = commentElement.querySelector('.py-4');
    if (!commentTextElement)
        throw new Error("Text element within the comment not found");
    const commentText = commentTextElement.textContent;
});
// Display Contents in DOM
const displayContents = () => __awaiter(this, void 0, void 0, function* () {
    var _a;
    const body = document.querySelector('body');
    if (!body)
        throw new Error("Body element not found");
    let comments = yield fetchData('comments');
    comments = processComments(comments);
    comments = comments.sort((a, b) => b.score - a.score);
    const commentsHTML = comments.map(comment => `
        ${renderComment(comment)}
        ${comment.replies.length > 0 ? `<div class="pl-4 ml-4 border-0 border-l-2 border-l-[#eaecf1]">
            ${comment.replies.map(reply => renderComment(reply, comment.id)).join('')}
        </div>` : ''}
    `).join('');
    const replyHTML = yield renderReply('Send');
    body.innerHTML = commentsHTML + replyHTML;
    (_a = document.querySelector('.reply-btn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', addComment);
});
displayContents();
