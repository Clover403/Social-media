const books = [
  {
    id: 1,
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    id: 2,
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

export const bookTypeDefs = `#graphql
  type Book {
    id: ID
    title: String
    author: String
  }
  
  type Query {
    getBooks: [Book]
    getBookById(id: ID): Book
  }
  
  input BookInput {
    title: String!
    author: String
  }

  type Mutation {
    createBook(newBook: BookInput): String
  }
`;

export const bookResolvers = {
  Query: {
    getBooks: () => {
      return books
    },
    getBookById: (_, args) => {
      const {id} = args
      const book = books.find(el => el.id == id)
      return book
    },
  },
  Mutation : {
    createBook: function (_, args) {
      const {title, author} = args.newBook
      
      if(title.length < 3) throw new Error("title min 3 char")

      const id = books.length + 1
      books.push({id, title, author})
      
      return "Berhasil"
    },
  }
}

