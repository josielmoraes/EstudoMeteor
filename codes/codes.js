
Todos= new Mongo.Collection('todos');
Lists = new Meteor.Collection('lists');
Router.route('/register');
Router.route('/login');
Router.route('/',{
	template:'home',
	name:'home',
});
Router.route('/list/:_id', {
    template: 'listPage',
    name: 'listPage',
    data: function(){
    	var currentList = this.params._id;
    	var currentUser= Meteor.userId();
        return Lists.findOne({ _id: currentList, createdBy:currentUser });
    },
    onBeforeAction: function(){
        var currentUser = Meteor.userId();
        if(currentUser){
            this.next();
        } else {
            this.render("login");
        }
    },
    waitOn: function(){
    	var currentList = this.params._id;
    	return [ Meteor.subscribe('lists'), Meteor.subscribe('todos', currentList) ]
    }
});
Router.configure({layoutTemplate:'main'});
Router.configure({
	layoutTemplate:'main',
	loadingTemplate:'loading'
});

if(Meteor.isClient){

	Meteor.subscribe('lists');
	
	Template.todos.helpers({
    	'todo': function(){
        	var currentList = this._id;
       		var currentUser = Meteor.userId();
        	return Todos.find({ listId: currentList, createdBy: currentUser }, {sort: {createdAt: -1}})
    	}
 	});

	Template.addTodo.events({
		'submit form' : function(event){
			event.preventDefault();
			var todoName= $('[name="todoName"]').val();
			var currentList= this._id;
			var currentUser=Meteor.userId();
			Todos.insert({
				name: todoName,
				completed: false,
				createdAt: new Date(),
				listId: currentList,
				createdBy: currentUser
			});
			$('[name="todoName"]').val('');
		}
	});
	Template.todoItem.events({
		 'click .delete-todo': function(event){
		    event.preventDefault();
		    var documentId = this._id;
		    var confirm = window.confirm("Delete this task?");
		    if(confirm){
		        Todos.remove({ _id: documentId });
		    }
		},
		'keyup [name=todoItem]':function(event){
			if(event.which == 13 || event.which == 27){
		        $(event.target).blur();
		    } else {
		        var documentId = this._id;
		        var todoItem = $(event.target).val();
		        Todos.update({ _id: documentId }, {$set: { name: todoItem }});
		    }
		},
		'change [type=checkbox]': function(){
			var documentId = this._id;
		    var isCompleted = this.completed;
		    if(isCompleted){
		        Todos.update({ _id: documentId }, {$set: { completed: false }});
		        console.log("Task marked as incomplete.");
		    } else {
		        Todos.update({ _id: documentId }, {$set: { completed: true }});
		        console.log("Task marked as complete.");
		    }
		}


});
	Template.todoItem.helpers({
				 'checked': function(){
		        var isCompleted = this.completed;
		        if(isCompleted){
		            return "checked";
		        } else {
		            return "";
		        }
		   }
	});
	Template.todosCount.helpers({
		'totalTodos': function(){
			var currentList=this.params._id;
			return Todos.find({ listId: currentList }).count();
		},
		'completedTodos':function(){
			var currentList=this.params._id;
			return Todos.find({ listId: currentList,completed:true}).count();
		}
	});

Template.addList.events({
    'submit form': function(event){
      event.preventDefault();
      var listName = $('[name=listName]').val();
      Meteor.call('createNewList', listName);
      $('[name=listName]').val('');
    }
});

Template.lists.helpers({
    'list': function(){
    	 var currentUser = Meteor.userId();
        return Lists.find({ createdBy: currentUser}, {sort: {name: 1}});
    }
});

Template.register.events({
	
});
Template.navigation.events({
	'click .logout': function(event){
		event.preventDefault();
		Meteor.logout();
	}
});

Template.login.events({
	
});

$.validator.setDefaults({
    rules: {
        email: {
            required: true,
            email: true
        },
        password: {
            required: true,
            minlength: 6
        }
    },
    messages: {
        email: {
            required: "You must enter an email address.",
            email: "You've entered an invalid email address."
        },
        password: {
            required: "You must enter a password.",
            minlength: "Your password must be at least {0} characters."
        }
    }
});

Template.login.onRendered(function(){
    $('.login').validate({
    submitHandler: function(event){
            var email = $('[name=email]').val();
            var password = $('[name=password]').val();
            Meteor.loginWithPassword(email, password, function(error){
                if(error){
                    if(error.reason == "User not found"){
        				validator.showErrors({
            				email: error.reason    
       				 	});
    				}
				    if(error.reason == "Incorrect password"){
				        validator.showErrors({
				            password: error.reason    
				        });
				    }
                } else {
                    var currentRoute = Router.current().route.getName();
                    if(currentRoute == "login"){
                        Router.go("home");
                    }
                }
            });
        }
    });
});
Template.register.onRendered(function(){
	 $('.register').validate({
        submitHandler: function(event){
            var email = $('[name=email]').val();
            var password = $('[name=password]').val();
            Accounts.createUser({
                email: email,
                password: password
            }, function(error){
                if(error){
                   if(error.reason == "Email already exists."){
				        validator.showErrors({
				            email: "That email already belongs to a registered user."   
				        });
				    }
                } else {
                    Router.go("home");
                }
            });
        }    
    });
});

Template.lists.onCreated(function () {
    this.subscribe('lists');
});

}


if(Meteor.isServer){
	Meteor.publish('lists', function(){
	    var currentUser = this.userId;
	    return Lists.find({ createdBy: currentUser });
	});

	Meteor.publish('todos', function(currentList){
	    var currentUser = this.userId;
	    return Todos.find({ createdBy: currentUser, listId: currentList })
	});
	Meteor.methods({
		'createNewList':function(listName){
			var currentUser=Meteor.userId();
			var data= {
				name: listName,
				createdBy: currentUser
			}
			if(!currentUser){
				throw new Meteor.Error("not-loged-in", "You are not logged-in");
			}else{
				List.insert(data);
			}
		}
	});
}

