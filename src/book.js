
class Book {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.year = data.year || null;
        this.author = data.author || '';
        this.summary = data.summary || '';
        this.publisher = data.publisher || '';
        this.pageCount = data.pageCount || 0;
        this.readPage = data.readPage || 0;
        this.reading = data.reading || false;
        this.finished = data.finished || false;
        this.insertedAt = data.insertedAt || null;
        this.updatedAt = data.updatedAt || null;
    }


    get progressPercentage() {
        if (this.pageCount === 0) return 0;
        return Math.round((this.readPage / this.pageCount) * 100);
    }

    get statusText() {
        if (this.finished) return 'Selesai';
        if (this.reading) return 'Sedang Dibaca';
        return 'Belum Dibaca';
    }

    get statusClass() {
        if (this.finished) return 'bg-green-100 text-green-800';
        if (this.reading) return 'bg-blue-100 text-blue-800';
        return 'bg-gray-100 text-gray-800';
    }

    get formattedInsertedAt() {
        return this.insertedAt ? new Date(this.insertedAt).toLocaleDateString('id-ID') : '';
    }

    get formattedUpdatedAt() {
        return this.updatedAt ? new Date(this.updatedAt).toLocaleDateString('id-ID') : '';
    }

    isValid() {
        return this.name.trim() !== '' && this.readPage <= this.pageCount;
    }

    getValidationErrors() {
        const errors = [];
        
        if (!this.name.trim()) {
            errors.push('Nama buku harus diisi');
        }
        
        if (this.readPage > this.pageCount) {
            errors.push('Halaman yang dibaca tidak boleh lebih dari jumlah halaman');
        }
        
        if (this.pageCount < 0) {
            errors.push('Jumlah halaman tidak boleh negatif');
        }
        
        if (this.readPage < 0) {
            errors.push('Halaman yang dibaca tidak boleh negatif');
        }

        return errors;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            year: this.year,
            author: this.author,
            summary: this.summary,
            publisher: this.publisher,
            pageCount: this.pageCount,
            readPage: this.readPage,
            reading: this.reading,
            finished: this.finished,
            insertedAt: this.insertedAt,
            updatedAt: this.updatedAt
        };
    }

    toApiPayload() {
        return {
            name: this.name,
            year: this.year,
            author: this.author,
            summary: this.summary,
            publisher: this.publisher,
            pageCount: this.pageCount,
            readPage: this.readPage,
            reading: this.reading
        };
    }

    static fromApiResponse(data) {
        return new Book(data);
    }

    static fromFormData(formData) {
        return new Book({
            name: formData.get('name') || formData.name,
            year: formData.get('year') ? parseInt(formData.get('year')) : parseInt(formData.year) || null,
            author: formData.get('author') || formData.author,
            summary: formData.get('summary') || formData.summary,
            publisher: formData.get('publisher') || formData.publisher,
            pageCount: formData.get('pageCount') ? parseInt(formData.get('pageCount')) : parseInt(formData.pageCount) || 0,
            readPage: formData.get('readPage') ? parseInt(formData.get('readPage')) : parseInt(formData.readPage) || 0,
            reading: formData.get('reading') === 'true' || formData.reading === true
        });
    }


    update(data) {
        Object.keys(data).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        });
        return this;
    }


    clone() {
        return new Book(this.toJSON());
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Book;
}