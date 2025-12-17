import { GraphQLDefinitionsFactory } from '@nestjs/graphql';
import { join } from 'path';

const definitionsFactory = new GraphQLDefinitionsFactory();

const generate = async () => {
  console.log('GENERATING...');
  await definitionsFactory.generate({
    typePaths: ['./src/**/*.graphql'],
    path: join(process.cwd(), 'src/graphql.schema.ts'),
    outputAs: 'class',
    // watch: true,
  });
  console.log('GENERATED!');
};

void generate();
