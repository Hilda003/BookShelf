
class BookView {
    constructor() {
        this.elements = {
       
            booksGrid: document.getElementById('booksGrid'),
            emptyState: document.getElementById('emptyState'),
            loadingSpinner: document.getElementById('loadingSpinner'),
    
            searchInput: document.getElementById('searchInput'),
            readingFilter: document.getElementById('readingFilter'),
            finishedFilter: document.getElementById('finishedFilter'),
            
       
            totalBooks: document.getElementById('totalBooks'),
            readingBooks: document.getElementById('readingBooks'),
            finishedBooks: document.getElementById('finishedBooks'),
  
            modal: document.getElementById('bookModal'),
            modalTitle: document.getElementById('modalTitle'),
            bookForm: document.getElementById('bookForm'),
      
            bookName: document.getElementById('bookName'),
            bookYear: document.getElementById('bookYear'),
            bookAuthor: document.getElementById('bookAuthor'),
            bookSummary: document.getElementById('bookSummary'),
            bookPublisher: document.getElementById('bookPublisher'),
            bookPageCount: document.getElementById('bookPageCount'),
            bookReadPage: document.getElementById('bookReadPage'),
            bookReading: document.getElementById('bookReading'),

            addBookBtn: document.getElementById('addBookBtn'),
            cancelBtn: document.getElementById('cancelBtn'),
            submitBtn: document.getElementById('submitBtn'),
            closeBtn: document.getElementById('closeBtn')
        };
        
        this.currentEditId = null;
        this.eventHandlers = new Map();
    }

    renderBooks(books) {
        if (!books || books.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();
        this.elements.booksGrid.innerHTML = books.map(book => this.createBookCard(book)).join('');
    }

    createBookCard(book) {
        const readingBadge = book.isReading ? 
            '<span class="badge badge-reading">Reading</span>' : 
            '<span class="badge badge-finished">Finished</span>';

        const progressBar = book.isReading ? 
            `<div class="progress-bar">
                <div class="progress-fill" style="width: ${(book.readPage / book.pageCount) * 100}%"></div>
            </div>
            <small class="progress-text">${book.readPage} / ${book.pageCount} pages</small>` : 
            '<div class="completed-icon">✓ Completed</div>';

        return `
            <div class="book-card" data-id="${book.id}">
                <div class="book-header">
                    <h3 class="book-title">${this.escapeHtml(book.name)}</h3>
                    ${readingBadge}
                </div>
                <div class="book-meta">
                    <p class="book-author">By ${this.escapeHtml(book.author)}</p>
                    <p class="book-year">${book.year}</p>
                    <p class="book-publisher">${this.escapeHtml(book.publisher)}</p>
                </div>
                <div class="book-summary">
                    <p>${this.escapeHtml(book.summary)}</p>
                </div>
                <div class="book-progress">
                    ${progressBar}
                </div>
                <div class="book-actions">
                    <button class="btn btn-edit" onclick="bookController.editBook('${book.id}')">
                        Edit
                    </button>
                    <button class="btn btn-delete" onclick="bookController.deleteBook('${book.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    updateStats(stats) {
        this.elements.totalBooks.textContent = stats.total;
        this.elements.readingBooks.textContent = stats.reading;
        this.elements.finishedBooks.textContent = stats.finished;
    }


    showModal(title = 'Add New Book') {
        this.elements.modalTitle.textContent = title;
        this.elements.modal.classList.add('active');
        document.body.classList.add('modal-open');
        this.elements.bookName.focus();
    }

    hideModal() {
        this.elements.modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        this.clearForm();
        this.currentEditId = null;
    }


    populateForm(book) {
        this.elements.bookName.value = book.name;
        this.elements.bookYear.value = book.year;
        this.elements.bookAuthor.value = book.author;
        this.elements.bookSummary.value = book.summary;
        this.elements.bookPublisher.value = book.publisher;
        this.elements.bookPageCount.value = book.pageCount;
        this.elements.bookReadPage.value = book.readPage;
        this.elements.bookReading.checked = book.isReading;
        this.currentEditId = book.id;
    }

    getFormData() {
        return {
            name: this.elements.bookName.value.trim(),
            year: parseInt(this.elements.bookYear.value),
            author: this.elements.bookAuthor.value.trim(),
            summary: this.elements.bookSummary.value.trim(),
            publisher: this.elements.bookPublisher.value.trim(),
            pageCount: parseInt(this.elements.bookPageCount.value),
            readPage: parseInt(this.elements.bookReadPage.value),
            isReading: this.elements.bookReading.checked
        };
    }

    clearForm() {
        this.elements.bookForm.reset();
        this.clearValidationErrors();
    }

    validateForm() {
        const data = this.getFormData();
        const errors = [];

        if (!data.name) errors.push('Book name is required');
        if (!data.year || data.year < 1000 || data.year > new Date().getFullYear()) {
            errors.push('Please enter a valid year');
        }
        if (!data.author) errors.push('Author name is required');
        if (!data.summary) errors.push('Summary is required');
        if (!data.publisher) errors.push('Publisher is required');
        if (!data.pageCount || data.pageCount < 1) errors.push('Page count must be greater than 0');
        if (!data.readPage || data.readPage < 0) errors.push('Read pages cannot be negative');
        if (data.readPage > data.pageCount) errors.push('Read pages cannot exceed total pages');

        if (errors.length > 0) {
            this.showValidationErrors(errors);
            return false;
        }

        return true;
    }

    showValidationErrors(errors) {
        this.clearValidationErrors();
        
        const errorContainer = document.createElement('div');
        errorContainer.className = 'validation-errors';
        errorContainer.innerHTML = `
            <ul>
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
        
        this.elements.bookForm.insertBefore(errorContainer, this.elements.bookForm.firstChild);
    }

    clearValidationErrors() {
        const errorContainer = this.elements.bookForm.querySelector('.validation-errors');
        if (errorContainer) {
            errorContainer.remove();
        }
    }


    showLoading() {
        this.elements.loadingSpinner.classList.add('active');
        this.elements.booksGrid.style.display = 'none';
        this.elements.emptyState.style.display = 'none';
    }

    hideLoading() {
        this.elements.loadingSpinner.classList.remove('active');
        this.elements.booksGrid.style.display = 'grid';
    }

    showEmptyState() {
        this.elements.emptyState.style.display = 'block';
        this.elements.booksGrid.style.display = 'none';
    }

    hideEmptyState() {
        this.elements.emptyState.style.display = 'none';
        this.elements.booksGrid.style.display = 'grid';
    }


    bindEvent(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
            this.eventHandlers.set(`${element.id}-${event}`, { element, event, handler });
        }
    }

    unbindEvents() {
        this.eventHandlers.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventHandlers.clear();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }


    getSearchQuery() {
        return this.elements.searchInput.value.trim().toLowerCase();
    }

    getActiveFilters() {
        return {
            reading: this.elements.readingFilter.checked,
            finished: this.elements.finishedFilter.checked
        };
    }

    getCurrentEditId() {
        return this.currentEditId;
    }

    focusSearchInput() {
        this.elements.searchInput.focus();
    }

    resetFilters() {
        this.elements.searchInput.value = '';
        this.elements.readingFilter.checked = false;
        this.elements.finishedFilter.checked = false;
    }


    destroy() {
        this.unbindEvents();
        this.currentEditId = null;
    }
}