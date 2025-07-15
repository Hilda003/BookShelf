const API_BASE_URL = 'http://localhost:9000';

class BookshelfApp {
    constructor() {
        this.books = [];
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadBooks();
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('addBookBtn').addEventListener('click', () => this.openModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('bookModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('bookModal')) {
                this.closeModal();
            }
        });


        document.getElementById('bookForm').addEventListener('submit', (e) => this.handleSubmit(e));

   
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e));
        document.getElementById('readingFilter').addEventListener('change', (e) => this.handleFilter(e));
        document.getElementById('finishedFilter').addEventListener('change', (e) => this.handleFilter(e));

        document.getElementById('bookPageCount').addEventListener('input', () => this.validatePages());
        document.getElementById('bookReadPage').addEventListener('input', () => this.validatePages());
    }

    async loadBooks() {
        try {
            this.showLoading(true);
            const response = await fetch(`${API_BASE_URL}/books`);
            const data = await response.json();
            
            if (data.status === 'success') {
                this.books = data.data.books;
                await this.loadFullBookDetails();
                this.renderBooks();
                this.updateStats();
            } else {
                this.showToast('Gagal memuat buku', 'error');
            }
        } catch (error) {
            console.error('Error loading books:', error);
            this.showToast('Terjadi kesalahan saat memuat buku', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadFullBookDetails() {
        const fullBooks = [];
        for (const book of this.books) {
            try {
                const response = await fetch(`${API_BASE_URL}/books/${book.id}`);
                const data = await response.json();
                if (data.status === 'success') {
                    fullBooks.push(data.data.book);
                }
            } catch (error) {
                console.error('Error loading book details:', error);
            }
        }
        this.books = fullBooks;
    }

    renderBooks() {
        const booksGrid = document.getElementById('booksGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (this.books.length === 0) {
            booksGrid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        booksGrid.innerHTML = this.books.map(book => this.createBookCard(book)).join('');
    }

    createBookCard(book) {
        const progressPercentage = book.pageCount > 0 ? (book.readPage / book.pageCount) * 100 : 0;
        const statusBadge = book.finished ? 
            '<span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Selesai</span>' :
            book.reading ? 
                '<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Sedang Dibaca</span>' :
                '<span class="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Belum Dibaca</span>';

        return `
            <div class="bg-white rounded-2xl shadow-lg p-6 book-card">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-800 mb-2">${book.name}</h3>
                        ${statusBadge}
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="app.editBook('${book.id}')" class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="app.deleteBook('${book.id}')" class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="space-y-2 text-sm text-gray-600 mb-4">
                    ${book.author ? `<p><i class="fas fa-user mr-2"></i>Penulis: ${book.author}</p>` : ''}
                    ${book.publisher ? `<p><i class="fas fa-building mr-2"></i>Penerbit: ${book.publisher}</p>` : ''}
                    ${book.year ? `<p><i class="fas fa-calendar mr-2"></i>Tahun: ${book.year}</p>` : ''}
                    <p><i class="fas fa-book mr-2"></i>Halaman: ${book.readPage}/${book.pageCount}</p>
                </div>
                
                ${book.summary ? `<p class="text-gray-700 text-sm mb-4 line-clamp-3">${book.summary}</p>` : ''}
                
                <div class="mb-3">
                    <div class="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>${progressPercentage.toFixed(0)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" 
                             style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center text-xs text-gray-500">
                    <span>Ditambahkan: ${new Date(book.insertedAt).toLocaleDateString('id-ID')}</span>
                    ${book.updatedAt !== book.insertedAt ? 
                        `<span>Diperbarui: ${new Date(book.updatedAt).toLocaleDateString('id-ID')}</span>` : ''}
                </div>
            </div>
        `;
    }

    updateStats() {
        const total = this.books.length;
        const reading = this.books.filter(book => book.reading && !book.finished).length;
        const finished = this.books.filter(book => book.finished).length;

        document.getElementById('totalBooks').textContent = total;
        document.getElementById('readingBooks').textContent = reading;
        document.getElementById('finishedBooks').textContent = finished;
    }

    openModal(book = null) {
        const modal = document.getElementById('bookModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (book) {
            modalTitle.textContent = 'Edit Buku';
            this.currentEditId = book.id;
            this.fillForm(book);
        } else {
            modalTitle.textContent = 'Tambah Buku';
            this.currentEditId = null;
            this.clearForm();
        }
        
        modal.classList.remove('hidden');
    }

    closeModal() {
        const modal = document.getElementById('bookModal');
        modal.classList.add('hidden');
        this.currentEditId = null;
        this.clearForm();
    }

    fillForm(book) {
        document.getElementById('bookName').value = book.name || '';
        document.getElementById('bookYear').value = book.year || '';
        document.getElementById('bookAuthor').value = book.author || '';
        document.getElementById('bookPublisher').value = book.publisher || '';
        document.getElementById('bookSummary').value = book.summary || '';
        document.getElementById('bookPageCount').value = book.pageCount || '';
        document.getElementById('bookReadPage').value = book.readPage || '';
        document.getElementById('bookReading').checked = book.reading || false;
    }

    clearForm() {
        document.getElementById('bookForm').reset();
    }

    validatePages() {
        const pageCount = parseInt(document.getElementById('bookPageCount').value) || 0;
        const readPage = parseInt(document.getElementById('bookReadPage').value) || 0;
        const readPageInput = document.getElementById('bookReadPage');
        
        if (readPage > pageCount) {
            readPageInput.setCustomValidity('Halaman yang dibaca tidak boleh lebih dari jumlah halaman');
        } else {
            readPageInput.setCustomValidity('');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('bookName').value,
            year: parseInt(document.getElementById('bookYear').value) || null,
            author: document.getElementById('bookAuthor').value,
            publisher: document.getElementById('bookPublisher').value,
            summary: document.getElementById('bookSummary').value,
            pageCount: parseInt(document.getElementById('bookPageCount').value) || 0,
            readPage: parseInt(document.getElementById('bookReadPage').value) || 0,
            reading: document.getElementById('bookReading').checked
        };

        try {
            let response;
            if (this.currentEditId) {
                response = await fetch(`${API_BASE_URL}/books/${this.currentEditId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch(`${API_BASE_URL}/books`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
            }

            const data = await response.json();
            
            if (data.status === 'success') {
                this.showToast(data.message, 'success');
                this.closeModal();
                this.loadBooks();
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('Error saving book:', error);
            this.showToast('Terjadi kesalahan saat menyimpan buku', 'error');
        }
    }

    async editBook(id) {
        const book = this.books.find(b => b.id === id);
        if (book) {
            this.openModal(book);
        }
    }

    async deleteBook(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus buku ini?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/books/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                this.showToast(data.message, 'success');
                this.loadBooks();
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting book:', error);
            this.showToast('Terjadi kesalahan saat menghapus buku', 'error');
        }
    }

    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredBooks = this.books.filter(book => 
            book.name.toLowerCase().includes(searchTerm)
        );
        this.renderFilteredBooks(filteredBooks);
    }

    handleFilter(e) {
        this.applyFilters();
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const readingFilter = document.getElementById('readingFilter').value;
        const finishedFilter = document.getElementById('finishedFilter').value;

        let filteredBooks = this.books;

        if (searchTerm) {
            filteredBooks = filteredBooks.filter(book => 
                book.name.toLowerCase().includes(searchTerm)
            );
        }

        if (readingFilter !== '') {
            const isReading = readingFilter === '1';
            filteredBooks = filteredBooks.filter(book => book.reading === isReading);
        }

        if (finishedFilter !== '') {
            const isFinished = finishedFilter === '1';
            filteredBooks = filteredBooks.filter(book => book.finished === isFinished);
        }

        this.renderFilteredBooks(filteredBooks);
    }

    renderFilteredBooks(filteredBooks) {
        const booksGrid = document.getElementById('booksGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (filteredBooks.length === 0) {
            booksGrid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        booksGrid.innerHTML = filteredBooks.map(book => this.createBookCard(book)).join('');
    }

    showLoading(show) {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const booksGrid = document.getElementById('booksGrid');
        
        if (show) {
            loadingSpinner.classList.remove('hidden');
            booksGrid.classList.add('hidden');
        } else {
            loadingSpinner.classList.add('hidden');
            booksGrid.classList.remove('hidden');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');
        
        toastMessage.textContent = message;
        
        if (type === 'success') {
            toastIcon.innerHTML = '<i class="fas fa-check-circle text-green-500"></i>';
        } else {
            toastIcon.innerHTML = '<i class="fas fa-exclamation-circle text-red-500"></i>';
        }
        
        toast.classList.remove('translate-x-full');
        
        setTimeout(() => {
            toast.classList.add('translate-x-full');
        }, 3000);
    }
}

// Initialize the app
const app = new BookshelfApp();