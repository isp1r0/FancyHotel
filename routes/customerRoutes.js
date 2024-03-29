var express = require('express');
var mysql = require('mysql');
var flash = require('connect-flash');
var session = require('express-session');

var sqlCreator = require('../SqlStatementCreator');

var connection = mysql.createConnection({
  host: "academic-mysql.cc.gatech.edu",
  user: "cs4400_Group_6",
  password: "tEVtJmV_",
  database : "cs4400_Group_6"
});
//just never let the connection
connection.connect()


var exampleRooms1 = [{ Room_no : 211, Room_category : 'Suite', No_people : 4, Cost_day : 250, Cost_extra_bed_day : 150, location: "Atlanta"},
                        { Room_no : 103, Room_category : 'Standard', No_people : 2, Cost_day : 100, Cost_extra_bed_day : 70, location: "Atlanta"},
                         { Room_no : 222, Room_category : 'Standard', No_people : 6, Cost_day : 150, Cost_extra_bed_day : 50, location: "Atlanta"}];

var exampleRooms2 = [{ Room_no : 211, Room_category : 'Suite', No_people : 4, Cost_day : 250, Cost_extra_bed_day : 150, location: "Atlanta"},
                        { Room_no : 103, Room_category : 'Standard', No_people : 2, Cost_day : 100, Cost_extra_bed_day : 70, location: "Atlanta"}];

var exampleCards = [{Card_no : 12312341234, Name : "Personal"},
					{Card_no : 1142243212, Name : "Business"}]


exports.postFindRooms = function(req,res) {
	console.log("startdate: " + req.body.startDate + " end date " + req.body.endDate + " location " + req.body.location);
	req.session.reservation_startDate = req.body.startDate;
	req.session.reservation_endDate = req.body.endDate;
	req.session.reservation_location = req.body.location;
	res.redirect('/availablerooms');
}

// find the rooms by ids and put them in the flash, grab the cards too
exports.postAvailableRooms = function(req, res) {
	//FIXME do actual query
	var rooms = getRooms(req.body.select_room);
	console.log({roooms:rooms});
    var query = sqlCreator.searchRooms(rooms);
    console.log(query);
    if (rooms.length > 0) {
    	connection.query(query, function(err, rows) {
	        console.log(rows);
	        console.log('errors',err);
	        if (err) {
	            req.flash('message', 'Problem connecting to DB');
	            res.redirect('/availablerooms')
	        } else {
	            if (rows.length > 0) {
	                req.flash('rooms', rows)
	                req.session.rooms_for_reservation = rooms;
	            }
	            res.redirect('/reservationdetails');
	        }
	    });
    } else {
    	req.flash('message', 'Please select at least one room.');
	    res.redirect('/availablerooms')
    }
    

	// //FIXME: need to use actual query fo/
	
}



var getRooms = function(select_room) {
	var items;
	if (!select_room) {
		//nothing selected
	} else if (!Array.isArray(select_room)) {
		//is one item
		items = [select_room];
	} else {
		// is multiple item
		items = select_room;
	}
	var itemsForQuery = [];
	for (var i in items) {
		itemsForQuery.push(getRoom(items[i]));
	}
	return itemsForQuery;
}

var getRoom = function(RoomnoLocation) {
	var arr = RoomnoLocation.split(" ");
	return {location : arr[1], Room_no : parseInt(arr[0])}
}

var roomIsChecked = function(room, checked_rooms) {
	for (var key in checked_rooms) {
		var room2 = checked_rooms[key];
		if (room.Room_no == room2.Room_no && room.location == room2.location) {
			return true;
		}
	}
	return false;
}

exports.postReservationDetails = function(req, res) {
	console.log("postReservationDetails");
	var startDate = req.session.reservation_startDate;
	var endDate = req.session.reservation_endDate;
	var location = req.session.reservation_location;
	//clear the session variables because we're done with it
	req.session.reservation_startDate = null;
	req.session.reservation_endDate = null;
	req.session.reservation_location = null;
	// console.log("startdate: " + startDate + " end date " + endDate + " location " + location);
	var totalCost = parseInt(req.body.totalCost);
	var isCancelled = 0;
	var Card_no = req.body.payment_info;

	// console.log({totalCost : totalCost, isCancelled : isCancelled, Card_no : Card_no});
	
	var rooms = req.session.rooms_for_reservation;
	// console.log({rooms : rooms});
	var checked_rooms = getRooms(req.body.extra_bed);
	// console.log({checked_rooms : checked_rooms});

	for (var room_key in rooms) {
		var room = rooms[room_key];
		if (roomIsChecked(room, checked_rooms)) {
			rooms[room_key].Extra_bed = 1;
		} else {
			rooms[room_key].Extra_bed = 0;
		}
	}
	// console.log({rooms : rooms});
	if (Card_no) {
		//createReservation = function(startDate, endDate, totalCost, isCancelled, cardNo, username, roomArray) 
		var query = sqlCreator.createReservation(startDate, endDate, totalCost, 0, Card_no, req.user.Username, rooms);
		console.log(query);
		connection.query(query, function (err, rows) {
			if (err) {
				console.log(err);
				req.flash('failure_message', "Error Connecting to DB. Try again.");
				res.redirect('/reservationdetails');
			} else {
				console.log(rows);

				req.session.last_reservation_id = 12343;
				res.render('customer/reservationid.ejs', {session : req.session});
			}
		});
	} else {
		req.flash('message', "Oops. Something went wrong, try again.");
		res.redirect('/reservationdetails');
	}
}



exports.postUpdatereservation1 = function(req, res) {
	// req.session.reservation_update_id = req.body.Reservation_ID;
	// console.log("Reservation_ID: ", req.session.reservation_update_id);
	res.redirect('/updatereservation2/' + req.body.Reservation_ID);
}

exports.postUpdatereservation2 = function(req, res) {
	req.session.update_reservation_startDate = req.body.newStartDate;
	req.session.update_reservation_endDate = req.body.newEndDate;
	req.session.update_reservation_location = req.body.location;
	res.redirect('/updatereservation3/' + req.params.reservation_id);
}

exports.postUpdatereservation3 = function(req, res) {
	//default extra bed to no and let that update later also
	var reservationId = req.session.reservation_update_id;
	var startDate = req.session.update_reservation_startDate;
	var endDate = req.session.update_reservation_endDate;
	var rooms = getRooms(req.body.select_room);
	var totalCost = parseInt(req.body.totalCost);

	//just printing quickly
	console.log({ reservationId : reservationId,
				startDate : startDate,
				endDate : endDate,
				rooms : rooms,
				totalCost : totalCost});
	//FIXME: this function is fairly complicated, it needs to
	//delete old HAS_ROOMS and make new ones and update values
	req.flash('success_message', "You have successfully updated your reservation with id: " + reservationId + ".");
	res.redirect('/home');
}

exports.postLookupreservation = function(req, res) {
	var cancel_id = req.body.Reservation_ID;
	console.log({cancel_id : cancel_id});
	res.redirect("/cancelreservation/" + cancel_id);
}

exports.postCancelreservation = function(req,res) {
	var cancel_id = req.params.cancel_id;
    var query = sqlCreator.cancelReservation(cancel_id, req.user.Username);
    connection.query(query, function(err, rows) {
        if (err) {
            console.log(err);
            req.flash('failure_message', "Error Connecting to DB. Try again.");
            res.redirect('/cancelreservation');
        } else {
            console.log({cancel_id : cancel_id});
            req.flash('success_message', "You have successfully DELETED your reservation with id: " + cancel_id + ".");
            res.redirect('/home');
        }
    })
}

exports.postGivereview = function(req,res) {
	var location = req.body.location;
	var rating = req.body.rating;
	var comment = req.body.comment;

	if (comment.length > 0) {
		var query = sqlCreator.createReviewWithComment(comment, rating, location, req.user.Username);
		console.log(query);
		connection.query(query, function (err, rows) {
			if (err) {
				console.log(err);
				req.flash('failure_message', "Error Connecting to DB. Try again.");
				res.redirect('/givereview');
			} else {
				console.log(rows);
				req.flash('success_message', "Your review of " + location + " was succesfully added. We appreciate your input!");
				res.redirect('/home');
			}
		});
	} else {
		var query = sqlCreator.createReviewNoComment(rating, location, req.user.Username);
		console.log(query);
		connection.query(query, function (err, rows) {
			if (err) {
				console.log(err);
				req.flash('failure_message', "Error Connecting to DB. Try again.");
				res.redirect('/givereview');
			} else {
				console.log(rows);
				req.flash('success_message', "Your review of " + location + " was succesfully added. We appreciate your input!");
				res.redirect('/home');
			}
		});
	}


}

exports.postAddPaymentInfo = function(req, res) {
	var newPaymentInfo = req.body;
	newPaymentInfo.Username = req.user.Username;
	console.log(newPaymentInfo);

	var query = sqlCreator.addPaymentInformation(newPaymentInfo.Name, newPaymentInfo.Exp_date, newPaymentInfo.CVV, newPaymentInfo.Card_no, req.user.Username);
	console.log(query);
	connection.query(query, function (err, rows) {
		if (err) {
			console.log(err);
			req.flash('failure_message', "Error Connecting to DB. Try again.");
			res.redirect('/paymentinfo');
		} else {
			console.log(rows);
			cardName = String(newPaymentInfo.Card_no);
			req.flash('success_message', "New Payment Info for Card ending with '" + cardName.substr(cardName.length - 5) + "' added.");
			res.redirect('/paymentinfo');
		}
	});
}

exports.postDeletePaymentInfo = function(req, res) {
	var Card_no = req.body.delete_card;
	console.log(Card_no);
	if (Card_no) {
		var query = sqlCreator.deletePaymentInformation(req.user.Username, Card_no);
		console.log(query);
		connection.query(query, function (err, rows) {
			if (err) {
				console.log(err);
				req.flash('failure_message', "Error Connecting to DB. Try again.");
				res.redirect('/paymentinfo');
			} else {
				console.log(rows);
				cardName = String(Card_no);
				req.flash('success_message', "Payment Info for Card that ends with " + cardName.substr(cardName.length - 5) + " has been succesfully DELETED.");
				res.redirect('/paymentinfo');
			}
		});
	}
}
