var sqlCreator = require('../SqlStatementCreator');

var express = require('express');
var mysql = require('mysql');
var flash = require('connect-flash');
var session = require('express-session');

var connection = mysql.createConnection({
  host: "academic-mysql.cc.gatech.edu",
  user: "cs4400_Group_6",
  password: "tEVtJmV_",
  database : "cs4400_Group_6"
});
//just never let the connection
connection.connect();

var exampleReservationReport = {August :
          [{Location : 'Charlotte', total_reservations : 12},
          {Location : 'Orlando' , total_reservations : 54},
          {Location : 'Atlanta', total_reservations : 96},
          {Location : 'Miami', total_reservations : 29},
          {Location : 'Savannah', total_reservations : 41}],
          September:
          [{Location : 'Charlotte', total_reservations : 19},
          {Location : 'Orlando' , total_reservations : 25},
          {Location : 'Atlanta', total_reservations : 63},
          {Location : 'Miami', total_reservations : 46},
          {Location : 'Savannah', total_reservations : 12}]};

var exampleRoomCategoryReport = {August :
          [{roomcat: 'family', Location : 'Charlotte', total_reservations : 19},
          {roomcat: 'suite',Location : 'Orlando' , total_reservations : 89},
          {roomcat: 'family',Location : 'Atlanta', total_reservations : 27},
          {roomcat: 'standard',Location : 'Miami', total_reservations : 29},
          {roomcat: 'suite',Location : 'Savannah', total_reservations : 41}],
          September:
          [{roomcat: 'family',Location : 'Charlotte', total_reservations : 26},
          {roomcat: 'suite',Location : 'Orlando' , total_reservations : 29},
          {roomcat: 'standard',Location : 'Atlanta', total_reservations : 61},
          {roomcat: 'standard',Location : 'Miami', total_reservations : 51},
          {roomcat: 'family',Location : 'Savannah', total_reservations : 17}]};

var exampleRevenueReport = {August :
          [{Location : 'Charlotte', total_revenue : 10000},
          {Location : 'Orlando' , total_revenue : 23000},
          {Location : 'Atlanta', total_revenue : 12000},
          {Location : 'Miami', total_revenue : 54000},
          {Location : 'Savannah', total_revenue : 21000}],
          September:
          [{Location : 'Charlotte', total_revenue : 1700},
          {Location : 'Orlando' , total_revenue : 2500},
          {Location : 'Atlanta', total_revenue : 600},
          {Location : 'Miami', total_revenue : 4600},
          {Location : 'Savannah', total_revenue : 2100}]};

exports.fillReservationreport = function(req, res, callback) {
  var data = {};
  connection.query(sqlCreator.createReservationReport(8), function(err, rows) {
    console.log(rows);
    console.log(err);
    if (err) {
      req.flash('message', 'Problem connecting to DB');
      return;
    } else {
      data.August = rows;
      console.log(data);
      req.flash('reservationreports', data);
    }
    connection.query(sqlCreator.createReservationReport(9), function(err,rows) {
      console.log(rows);
      console.log(err);
      if (err) {
        req.flash('message', 'Problem connecting to DB');
        return;
      } else {
        data.September = rows;
        console.log(data);
        req.flash('reservationreports', data);
      }
      callback();
    })
  });
  //req.flash('reservationreports', exampleReservationReport);
}

exports.fillPopularRoomReport = function(req, res, callback) {
  var data = {};
  connection.query(sqlCreator.createPopularRoomReport(8), function(err, rows) {
    console.log(rows);
    console.log(err);
    if (err) {
      req.flash('message', 'Problem connecting to DB');
      return;
    } else {
      data.August = rows;
      console.log(data);
      req.flash('roomcatreports', data);
    }
    connection.query(sqlCreator.createPopularRoomReport(9), function(err,rows) {
      console.log(rows);
      console.log(err);
      if (err) {
        req.flash('message', 'Problem connecting to DB');
        return;
      } else {
        data.September = rows;
        console.log(data);
        req.flash('roomcatreports', data);
      }
      callback();
    });
  });
  //req.flash('roomcatreports', exampleRoomCategoryReport);
}

exports.fillRevenueReport = function(req,res, callback){
    getRevenueReport(function(data) {
        req.flash('revenuereports', data);
        callback();
    });
}

var getRevenueReport = function(callback) {
    var data = {};
    var counter = 0;
    var cities = ['Atlanta', 'Charlotte', 'Miami', 'Orlando', 'Savannah'];
    var months = {8 : 'Auguest' , 9 : 'September'};
    if (counter < 10){
        for (month_no in months) {
            //var month = months[month_no];
            data[String(month_no)] = [];
            for (city_index in cities) {
                console.log('city: ' + cities[city_index] + ' month_no: ' + month_no);
                var query = sqlCreator.createMonthlyReport(month_no, cities[city_index]);
                //console.log('query', query);
                connection.query(query, function(err, rows) {
                    console.log(rows);
                    console.log('errors', err);
                    if (err) {
                        //req.flash('failure_message', 'Problem connecting to DB');
                        callback();
                    } else {
                        if (rows.length > 0) {
                            //req.flash('reservation', rows);
                            console.log('city: ' + cities[city_index] + ' month_no: ' + rows.Month);
                            data[rows[0].Month].push(rows[0]);
                        }
                        console.log(data);
                        counter++;
                        if (counter == 10){
                            callback(data);
                        }
                    }


                });
            }
        }
    }

}
