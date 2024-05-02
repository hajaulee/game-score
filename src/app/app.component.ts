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


    if (params.colDef.field == 'name') {
      this.inputField = document.createElement('input');
      this.inputField.type = params.colDef.type;
    } else {
      this.inputField = document.createElement('select');
      params?.getOptions?.()?.forEach((option: any) => {
        const optionEle = document.createElement('option');
        optionEle.value = option;
        optionEle.innerHTML = option;
        this.inputField.appendChild(optionEle)
      });
    }
    this.inputField.className = "cell-input";
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

  // Constants
  title = 'game-score';
  defaultPlayes = "A, B, C, D, E";
  defaultMoneys = "200, -20, -40, -60, -80"

  // Normal variables
  settingOpened = true;
  editingModeEnabled = false;
  latestGame: string | undefined = 'score1';
  moneyInput = this.defaultMoneys;
  moneyOptions = this.moneyInput.split(",").map(it => Number(it.trim()));
  playerInput = this.defaultPlayes;
  players: string[] = [];


  //Ag grid
  rowData: any[] = [];

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef[] = [
    {
      headerName: "Tên",
      field: "name",
      pinned: 'left',
      width: 110,
      autoHeight: false,
      suppressMovable: true,
      valueFormatter: (params) => params.data.name + "/" + params.data.sum
    },
    // {
    //   headerName: "Tổng", field: "sum", pinned: 'left', width: 100, cellStyle: {'text-align': 'right'}, suppressMovable: true
    // },
  ];

  gridOptions = {
  }


  ngOnInit(): void {
    this.loadData();
    this.initColumns();
    this.toogleEditMode();
  }

  initColumns() {
    const scoreCols: ColDef[] = Array(50).fill(null).map((_, index) => ({
      headerName: `V${index + 1}`,
      field: `score${index + 1}`,
      width: 110,
      type: 'number',
      suppressMovable: true,
      cellClass: (params) => params.colDef.field == this.latestGame ? 'latest-game' : '',
      cellRenderer: GenericEditorAsRenderer,
      cellRendererParams: {
        shouldBeEditing: () => this.editingModeEnabled,
        getOptions: () => this.moneyOptions
      }
    }));
    this.colDefs = this.colDefs.concat(scoreCols);
  }

  toogleEditMode() {
    this.editingModeEnabled = !this.editingModeEnabled;
    this.calculateSum();
    this.saveData();
    this.updateLatestGame();

    this.scoreTables?.api.ensureColumnVisible(this.latestGame!!, 'auto');
    this.scoreTables?.api.redrawRows();
  }

  updateLatestGame() {
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

  parseMoneyInput() {
    this.moneyOptions = [0].concat(this.moneyInput?.split(",").map(it => Number(it.trim())));
  }

  parsePlayers() {
    this.players = this.playerInput?.split(",").map(it => it.trim());
  }

  applySetting() {
    this.settingOpened = false;
    this.editingModeEnabled = false;
    this.changePlayerNames();
    this.scoreTables?.api.redrawRows();
    this.saveData();
  }

  changePlayerNames() {
    this.rowData = this.players.map((name, index) => {
      const savedScore = this.rowData?.[index];
      return {
        sum: 0,
        ...savedScore,
        name: name,
      }
    });
  }

  saveData() {
    localStorage.setItem("SCORES", JSON.stringify(this.rowData));
    localStorage.setItem("PLAYERS", this.playerInput);
    localStorage.setItem("MONEYS", this.moneyInput);
  }

  loadData() {
    this.moneyInput = localStorage.getItem("MONEYS") ?? this.defaultMoneys;
    this.playerInput = localStorage.getItem("PLAYERS") ?? this.defaultPlayes;
    this.parsePlayers();
    this.parseMoneyInput();


    const savedData = JSON.parse(localStorage.getItem("SCORES") ?? '[]');
    this.rowData = this.players.map((name, index) => {
      const savedScore = savedData?.[index];
      return {
        sum: 0,
        ...savedScore,
        name: name,
      }
    });
  }
}
