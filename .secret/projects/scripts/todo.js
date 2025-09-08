const todoList = JSON.parse(localStorage.getItem('list')) || [];

renderTodoList();

function addTodo() {
    const inputElement = document.querySelector('.js-name-input');
    const dateElement = document.querySelector('.js-due-date-input');
    const name = inputElement.value;
    const dueDate = dateElement.value;

    todoList.push({
        name,
        dueDate
    });
    inputElement.value = '';
    dateElement.value = '';

    renderTodoList();
    saveToLocalStorage();
}

function renderTodoList() {
    let todoListHtml = '';

    for (let i = 0; i < todoList.length; i++) {
        const todoObject = todoList[i];
        const { name, dueDate } = todoObject;
        const html = `<div>${name}</div> <div>${dueDate}</div> <button class="delete-todo-button" onclick=" todoList.splice(${i}, 1); saveToLocalStorage(); renderTodoList(); ">Delete</button>`;

        todoListHtml += html;
    }

    document.querySelector(".js-todo-list").innerHTML = todoListHtml;
}

function saveToLocalStorage() {
   localStorage.setItem('list', JSON.stringify(todoList)); 
}

// Outputs index of first appearance of the given word (-1 if not present)
function findIndex(array, word) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === word)
            return i;
    }

    return -1;
}

// Removes last 2 eggs from the given array, keeps original array intact (since arrays are just references so it has to be done manually)
function removeEgg(foods) {
    let array = [];
    let count = 0;

    foods = foods.slice();
    foods.reverse();

    for (let i = 0; i < foods.length; i++) {
        if (foods[i] === 'egg' && count < 2) {
            count++;
            continue;
        }
        array.push(foods[i]);
    }

    array.reverse();

    return array;
}

// Famous FizzBuzz problem
function fizzBuzz() {
    for (let i = 1; i <= 20; i++) {
        if (i % 3 === 0 && i % 5 === 0)
            console.log('FizzBuzz');
        else if (i % 3 === 0)
            console.log('Fizz');
        else if (i % 5 === 0)
            console.log('Buzz');
        else
            console.log(i);
    }
}

// Returns unique array strictly using the findIndex() function
function unique(array) {
    let result = [];

    for (let i = 0; i < array.length; i++) {
        if (findIndex(result, array[i]) === -1)
            result.push(array[i]);
    }

    return result;
}
