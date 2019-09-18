var DatatableAutoColumnHideDemo = {
    init: function() {
        $(".m_datatable").mDatatable({
            data: {
                type: "remote",
                source: {
                    read: {
                        url: "https://keenthemes.com/metronic/themes/themes/metronic/dist/preview/inc/api/datatables/demos/default.php"
                    }
                },
                pageSize: 10,
                saveState: !1,
                serverPaging: !0,
                serverFiltering: !0,
                serverSorting: !0
            },
            sortable: !0,
            pagination: !0,
            toolbar: {
                items: {
                    pagination: {
                        pageSizeSelect: [10, 20, 30, 50, 100]
                    }
                }
            },
            search: {
                input: $("#generalSearch")
            },
            rows: {
                autoHide: !0
            },
            columns: [{
                field: "OrderID",
                title: "Order ID",
                width: 150,
                template: "{{OrderID}} - {{ShipCountry}}"
            }, {
                field: "ShipCountry",
                title: "Ship Country",
                width: 150,
                template: function(t) {
                    return t.ShipCountry + " - " + t.ShipCity
                }
            }, {
                field: "ShipCity",
                title: "Ship City"
            }, {
                field: "Currency",
                title: "Currency",
                width: 100
            }, {
                field: "ShipDate",
                title: "Ship Date",
                sortable: "asc",
                type: "date",
                format: "MM/DD/YYYY"
            }, {
                field: "Latitude",
                title: "Latitude",
                type: "number"
            }, {
                field: "Longitude",
                title: "Longitude"
            }, {
                field: "Notes",
                title: "Notes",
                width: 350
            }, {
                field: "Department",
                title: "Department"
            }, {
                field: "Website",
                title: "Website"
            }, {
                field: "TotalPayment",
                title: "Total Payment"
            }, {
                field: "Status",
                title: "Status",
                template: function(t) {
                    var e = {
                        1: {
                            title: "Pending",
                            class: "m-badge--brand"
                        },
                        2: {
                            title: "Delivered",
                            class: " m-badge--metal"
                        },
                        3: {
                            title: "Canceled",
                            class: " m-badge--primary"
                        },
                        4: {
                            title: "Success",
                            class: " m-badge--success"
                        },
                        5: {
                            title: "Info",
                            class: " m-badge--info"
                        },
                        6: {
                            title: "Danger",
                            class: " m-badge--danger"
                        },
                        7: {
                            title: "Warning",
                            class: " m-badge--warning"
                        }
                    };
                    return '<span class="m-badge ' + e[t.Status].class + ' m-badge--wide">' + e[t.Status].title + "</span>"
                }
            }, {
                field: "Type",
                title: "Type",
                template: function(t) {
                    var e = {
                        1: {
                            title: "Online",
                            state: "danger"
                        },
                        2: {
                            title: "Retail",
                            state: "primary"
                        },
                        3: {
                            title: "Direct",
                            state: "accent"
                        }
                    };
                    return '<span class="m-badge m-badge--' + e[t.Type].state + ' m-badge--dot"></span>&nbsp;<span class="m--font-bold m--font-' + e[t.Type].state + '">' + e[t.Type].title + "</span>"
                }
            }]
        })
    }
};
jQuery(document).ready(function() {
    DatatableAutoColumnHideDemo.init()
});