import { Component, OnInit, ViewChild } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular'
import { ColDef } from 'ag-grid-community';



class GenericEditorAsRenderer {

  // variables
  valueSpan: any;
  inputField: any;
  shouldBeEditing: any;


  init(params: any) {
    this.shouldBeEditing = params.shouldBeEditing;
    this.valueSpan = document.createElement('span');
    this.valueSpan.innerText = params.value ?? '';

    this.inputField = document.createElement('input');
    this.inputField.className = "cell-input";
    this.inputField.type = params.colDef.type;
    this.inputField.value = params.value;
    this.inputField.onchange = () => params.setValue(this.inputField.value);
  }

  getGui() {
    return this.shouldBeEditing() ? this.inputField : this.valueSpan;
  }

  refresh() {
    return false;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild("scoreTables") scoreTables: AgGridAngular | undefined;

  title = 'game-score';


  // Normal variables
  editingModeEnabled = false;
  latestGame: string | undefined = 'score1';


  //Ag grid
  rowData: any[] = [];

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef[] = [
    {
      headerName: "Tên", field: "name", pinned: 'left', width: 90, cellRenderer: GenericEditorAsRenderer,
      cellRendererParams: {
        shouldBeEditing: () => this.editingModeEnabled,
      }
    },
    {
      headerName: "Tổng", field: "sum", width: 100, cellStyle: {'text-align': 'right'}
    },
  ];


  ngOnInit(): void {
    this.initColumns();
    this.loadData();
    this.toogleEditMode();
  }

  initColumns() {
    const scoreCols: ColDef[] = Array(50).fill(null).map((_, index) => ({
      headerName: `V${index + 1}`,
      field: `score${index + 1}`,
      width: 110,
      type: 'number',
      cellClass: (params) => params.colDef.field == this.latestGame ? 'latest-game' : '',
      cellRenderer: GenericEditorAsRenderer,
      cellRendererParams: {
        shouldBeEditing: () => this.editingModeEnabled,
      }
    }));
    this.colDefs = this.colDefs.concat(scoreCols);
  }

  toogleEditMode() {
    this.editingModeEnabled = !this.editingModeEnabled;
    this.calculateSum();
    this.saveData();
    this.updateLatestGame();

    this.scoreTables?.api.redrawRows();
  }

  updateLatestGame(){
    this.latestGame = this.colDefs.map(col => col.field!!)
    .filter(key => key.startsWith('score'))
    .sort((a, b) => Number(b.slice(5)) - Number(a.slice(5)))
    .find(key => this.rowData.some(row => !!row[key]));
    this.latestGame = this.latestGame ? ('score' + (Number(this.latestGame.slice(5)) + 1)) : 'score1';
  }

  reset() {
    if (window.confirm("Xóa toàn bộ điểm số?")) {
      this.rowData = [];
      this.saveData();
      this.loadData();
      this.updateLatestGame();
    }
    this.scoreTables?.api.redrawRows();
  }

  calculateSum() {
    this.rowData.forEach(row => {
      row.sum = Object.keys(row).filter(key => key.startsWith("score")).map(key => Number(row[key]) ?? 0).reduce((a, b) => a + b, 0)
    })
  }

  saveData() {
    localStorage.setItem("SCORES", JSON.stringify(this.rowData));
  }

  loadData() {
    const savedData = JSON.parse(localStorage.getItem("SCORES") ?? '[]');
    this.rowData = Array(10).fill(null).map((_, index) => {
      const savedScore = savedData?.[index];
      return {
        name: `Name${index + 1}`,
        sum: 0,
        ...savedScore
      }
    })
  }
}
