
class BookService {
    constructor() {
        this.baseUrl = 'http://localhost:9000';
        this.endpoints = {
            books: '/books',
            book: (id) => `/books/${id}`
        };
    }

    async _makeRequest(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(`${this.baseUrl}${url}`, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw new ApiError(error.message, error.status || 500);
        }
    }

    _validateResponse(response) {
        if (!response || response.status !== 'success') {
            throw new ApiError(response?.message || 'Unknown error occurred', 400);
        }
        return response;
    }
    async getAllBooks(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
   
            if (filters.name) queryParams.append('name', filters.name);
            if (filters.reading !== undefined) queryParams.append('reading', filters.reading);
            if (filters.finished !== undefined) queryParams.append('finished', filters.finished);

            const queryString = queryParams.toString();
            const url = `${this.endpoints.books}${queryString ? `?${queryString}` : ''}`;
            
            const response = await this._makeRequest(url);
            this._validateResponse(response);
            
            return response.data.books.map(book => Book.fromApiResponse(book));
        } catch (error) {
            console.error('Error fetching books:', error);
            throw error;
        }
    }

    async getBookById(id) {
        try {
            if (!id) {
                throw new ApiError('Book ID is required', 400);
            }

            const response = await this._makeRequest(this.endpoints.book(id));
            this._validateResponse(response);
            
            return Book.fromApiResponse(response.data.book);
        } catch (error) {
            console.error('Error fetching book:', error);
            throw error;
        }
    }

    async createBook(bookData) {
        try {
            const book = bookData instanceof Book ? bookData : Book.fromFormData(bookData);
    
            if (!book.isValid()) {
                const errors = book.getValidationErrors();
                throw new ValidationError(errors.join(', '));
            }

            const response = await this._makeRequest(this.endpoints.books, {
                method: 'POST',
                body: JSON.stringify(book.toApiPayload())
            });
            
            this._validateResponse(response);
            
            return {
                success: true,
                message: response.message,
                bookId: response.data.bookId
            };
        } catch (error) {
            console.error('Error creating book:', error);
            throw error;
        }
    }

    async updateBook(id, bookData) {
        try {
            if (!id) {
                throw new ApiError('Book ID is required', 400);
            }

            const book = bookData instanceof Book ? bookData : Book.fromFormData(bookData);
    
            if (!book.isValid()) {
                const errors = book.getValidationErrors();
                throw new ValidationError(errors.join(', '));
            }

            const response = await this._makeRequest(this.endpoints.book(id), {
                method: 'PUT',
                body: JSON.stringify(book.toApiPayload())
            });
            
            this._validateResponse(response);
            
            return {
                success: true,
                message: response.message
            };
        } catch (error) {
            console.error('Error updating book:', error);
            throw error;
        }
    }

    async deleteBook(id) {
        try {
            if (!id) {
                throw new ApiError('Book ID is required', 400);
            }

            const response = await this._makeRequest(this.endpoints.book(id), {
                method: 'DELETE'
            });
            
            this._validateResponse(response);
            
            return {
                success: true,
                message: response.message
            };
        } catch (error) {
            console.error('Error deleting book:', error);
            throw error;
        }
    }

    async loadFullBookDetails(books) {
        try {
            const fullBooks = [];
            
            for (const book of books) {
                try {
                    const fullBook = await this.getBookById(book.id);
                    fullBooks.push(fullBook);
                } catch (error) {
                    console.error(`Error loading details for book ${book.id}:`, error);
            
                    fullBooks.push(Book.fromApiResponse(book));
                }
            }
            
            return fullBooks;
        } catch (error) {
            console.error('Error loading full book details:', error);
            throw error;
        }
    }

    async checkConnection() {
        try {
            await this._makeRequest('/health');
            return true;
        } catch (error) {
            console.warn('API connection check failed:', error);
            return false;
        }
    }
}

class ApiError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}


if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BookService, ApiError, ValidationError };
}