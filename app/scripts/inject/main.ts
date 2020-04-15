import {Greeter} from './greeter';

let greeter  :any = new Greeter('Cecil')
let greeting :any = greeter.getGreeting()

console.log(greeting);