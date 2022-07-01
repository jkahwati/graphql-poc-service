import express from 'express';
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const app = express();

// Construct a schema, using GraphQL schema language
let schema = buildSchema(`
  input MessageInput {
    content: String
    author: String
  }

  type Message {
    id: ID!
    content: String
    author: String
  }

  type Query {
    getMessage(id: ID!): Message
    getAllMessages: [Message]
  }

  type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
  }
`);

// If Message had any complex fields, we'd put them on this object.
class Message {

  private id: string
  private content: string
  private author: string

  constructor(id: any, { content, author }: any) {
    this.id = id;
    this.content = content;
    this.author = author;
  }
}

// Database
let fakeDatabase: any = {};

// The root provides a resolver function for each API endpoint
let root = {
  getMessage: ({ id }: any) => {
    if (!fakeDatabase[id]) {
      throw new Error('no message exists with id ' + id);
    }
    return new Message(id, fakeDatabase[id]);
  },
  getAllMessages: ({ id }: any) => {
    return Object.keys(fakeDatabase).map((key: any) => {
      return new Message(key, fakeDatabase[key])
    })
  },
  createMessage: ({ input }: any) => {
    // Create a random id for our "database".
    let id = require('crypto').randomBytes(10).toString('hex');
    fakeDatabase[id] = input;
    return new Message(id, input);
  },
  updateMessage: ({ id, input }: any) => {
    if (!fakeDatabase[id]) {
      throw new Error('no message exists with id ' + id);
    }
    // This replaces all old data, but some apps might want partial update.
    fakeDatabase[id] = input;
    return new Message(id, input);
  },
};

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.listen(3000);
console.log('Running a GraphQL API server at http://localhost:3000/graphql');