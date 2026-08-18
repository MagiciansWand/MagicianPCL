// ===== Magician 助手 =====
const AssistantManager = {
  chatHistory: [],
  isProcessing: false,

  init() {
    this.setupEventListeners();
  },

  setupEventListeners() {
    // 发送按钮
    document.getElementById('btn-send-query')?.addEventListener('click', () => {
      this.sendQuery();
    });

    // 回车发送
    document.getElementById('assistant-query')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendQuery();
      }
    });
  },

  async sendQuery() {
    const input = document.getElementById('assistant-query');
    const query = input?.value.trim();

    if (!query || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    input.value = '';

    // 添加用户消息
    this.addMessage('user', query);

    // 显示加载状态
    const loadingId = this.addMessage('assistant', '思考中...', true);

    try {
      // 调用 Wiki API 查询
      const response = await this.queryWiki(query);
      
      // 移除加载消息
      this.removeMessage(loadingId);
      
      // 添加回复
      this.addMessage('assistant', response);
    } catch (error) {
      this.removeMessage(loadingId);
      this.addMessage('assistant', `抱歉，查询失败: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  },

  async queryWiki(query) {
    try {
      // 调用后端 Wiki API
      const result = await window.electronAPI.queryWiki(query);
      
      if (result.success) {
        return result.answer;
      } else {
        return `抱歉，我无法找到相关信息。\n\n建议访问 [Minecraft Wiki](https://minecraft.wiki) 查看更多内容。`;
      }
    } catch (e) {
      throw new Error(e.message);
    }
  },

  addMessage(role, content, isLoading = false) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageId = `msg-${Date.now()}`;

    const messageHtml = `
      <div class="message ${role}" id="${messageId}">
        <div class="message-avatar">${role === 'user' ? '👤' : '🧙'}</div>
        <div class="message-content ${isLoading ? 'loading' : ''}">
          ${isLoading ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : this.formatContent(content)}
        </div>
      </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    this.chatHistory.push({ role, content, id: messageId });

    return messageId;
  },

  removeMessage(messageId) {
    const messageEl = document.getElementById(messageId);
    if (messageEl) {
      messageEl.remove();
    }
  },

  formatContent(content) {
    // 简单的 Markdown 格式化
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/\n/g, '<br>');
  }
};
