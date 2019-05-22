<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: "App"
};
</script>

<style>
#dashboard {
  padding: 64px 15px 0px;
}

/* Chips to represent what each view is */
.v-chip {
  font-size: 18px;
}

/* Lasso CSS*/
.drawn{
  fill:rgba(255, 255, 255, 0.5);
  stroke:saddlebrown;
  stroke-width: 1.5px;
}

.origin{
  fill:saddlebrown;
  opacity: 0.5;
}

/* Navigator CSS */
.v-navigation-drawer{
  padding: 15px;
}

#control-panel{
  box-shadow: 0 0px 0px 0px rgba(0,0,0,.2), 0 0px 0px 0 rgba(0,0,0,.14), 0 0px 0px 0 rgba(0,0,0,.12)
}

/* Causality table CSS */
.table-container {
     height: calc(10vh - 450px);
}
 .table-container table {
     display: flex;
     flex-flow: column;
     height: 100%;
     width: 100%;
}
 .table-container table thead {
     flex: 0 0 auto;
     width: 100%;
}
 .table-container table tbody {
     flex: 1 1 auto;
     display: block;
     width: 100%;
     overflow-y: auto;
}
 .table-container table tbody tr {
     width: 100%;
}
 .table-container table thead, .table-container table tbody tr {
     display: table;
     table-layout: fixed;
}
 .table-container table {
     border-collapse: collapse;
}
 .table-container table td, .table-container table th {
     padding: 0.8em;
}
 .table-container table th {
     border: 1px solid black;
     font-size: 0.7vw;
}
 .table-container table td {
     border: 1px solid #e7e1e1;
     font-size: 0.85em;
    /* necessary to set for proper "showing row x of y" calculations if infinate scoll */
     white-space: nowrap;
     text-align: center;
     padding: 10px 5px;
     white-space: nowrap;
     text-overflow: ellipsis;
}
 .table-container table thead {
     border: 2px solid #0F0FA3;
}
 .table-container th {
     background-color: black;
     color: #b5aba4;
     cursor: pointer;
     -webkit-user-select: none;
   -moz-user-select: none !important;
     -ms-user-select: none;
     user-select: none;
}
 .table-container table tbody td {
     padding: 8px;
     cursor: pointer;
}
 .table-container table tbody tr:hover {
     background-color: rgba(255, 255, 255, 0.5);
}
 .table-container table thead td {
     padding: 10px 5px;
}
 .table-container tr:nth-child(even) {
     background-color: rgba(255, 255, 255, 0.5)
}

/* START Adjustments for width and scrollbar hidden */
 .table-container th.table-action, .table-container td.table-action {
     width: 5.8vw;
}
 .table-container table thead {
     width: calc(100% - 1px);
}
 .table-container table tbody::-webkit-scrollbar {
     width: 1px;
}
 .table-container table tbody::-webkit-scrollbar {
     width: 1px;
}
 .table-container table tbody::-webkit-scrollbar-thumb {
     width: 1px;
}

table.my-table-scroll,
table.my-table-scroll > thead,
table.my-table-scroll > tbody,
table.my-table-scroll > tfoot,
table.my-table-scroll > tbody > tr,
table.my-table-scroll > thead > tr {
  width: 100%;
  display: block
}
table.my-table-scroll > thead,
table.my-table-scroll > tbody,
table.my-table-scroll > tfoot {
  display: block;
  width: 100%;
  overflow-y: scroll;
}
table.my-table-scroll > thead,
table.my-table-scroll > tfoot {
  height: auto;
}
/* these last two rules you will need to tweak on an as needed basis */
table.my-table-scroll > tbody {
  /* set max height for tbody before it scrolls */
  max-height: 200px;
}
table.my-table-scroll > thead > tr > th,
table.my-table-scroll > thead > tr > td,
table.my-table-scroll > tbody > tr > th,
table.my-table-scroll > tbody > tr > td,
table.my-table-scroll > tfoot > tr > th,
table.my-table-scroll > tfoot > tr > td {
  display: inline-block;
  /* you need to explicitly specify the width of the table cells */
  /* either equal, or specify individual widths based on col index. */
  /* Here, we assume you have 4 columns of data */
  width: 25%;
}

</style>
