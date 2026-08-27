<script setup>
import { reactive, computed, ref } from 'vue'
import Message from "@hiway/utils/notify"
import draggable from 'vuedraggable'
import { useUserStore } from '@hiway/stores/user'
import { commonSearchApi, commonRskSaveApi } from '@hiway/api/commonApi'
import _ from 'lodash'



const isFlag = ref(true)
const sItem = ref(null)

let partsArray = reactive([])

let WORK_STANDARD_UNIT = reactive([])
let WORK_STANDARD_ACT = reactive([])
let WORK_STANDARD_RISK = reactive([])
let textReadOnly = reactive(true)
const saveParam = reactive([])
const rSKBA0010popup2 = ref(null) // 위험요인
const rSKBA0010popup3 = ref(null) // 감소대책
const rSKBA0010popup4 = ref(null) // 사고정보


// const saveParam = ref(null)

const userStore = useUserStore() //유저정보


//코드리스트 선언
const codeList = reactive({
  company: [],  
  riskType: [],
  USER_DIV: [
    { COD: "", TXT: "전체" },
    { COD: "A", TXT: "직영" },
    { COD: "B", TXT: "사내협력사" },
    { COD: "D", TXT: "단기공사" },
    { COD: "Z", TXT: "기타" },
  ],
  accdntType: [],
  proc: [],
  gubun: [],
  BEFOR_TYPE: [
    { COD: '1', TXT: '1(최하)' },
    { COD: '2', TXT: '2(하)' },
    { COD: '3', TXT: '3(중)' },
    { COD: '4', TXT: '4(상)' },
    { COD: '5', TXT: '5(최상)' },
  ],
  deptCd: userStore.deptCd,
  bsnsCd: userStore.bsnsCd,   
  userId: userStore.userId,
})



const ArrayList = ref([])

const child = computed(id => {
  return _.filter(todos, { id: id })
})

const selectRow = ele => {
  //console.log('ele', ele)

  const docOther = document.getElementsByClassName('selected-draggable')

  docOther.forEach(item => {
    item.classList.remove('selected-draggable')
  })

  const classss = `${'row1_'}${ele.id}`
  const doc = document.getElementById(classss)

  doc.classList.add('selected-draggable')
}

var tempA = null
var tempB = null
var tempC = null

const selectedItem = item => {
  if(item.level == 1)
  {
    // 선택된 대분류 찾기
    tempA = _.find(ArrayList.value, { id: item.id })

    console.log('대분류 = ', tempA)
  }
  else if(item.level == 2)
  {
    // 선택된 중분류 찾기
    console.log('item = ', item)
    let idA = item.id.substr(0, 1)
    console.log('idA = ', idA)
    console.log('ArrayList.value = ', ArrayList.value)
    let A = _.find(ArrayList.value, { id : idA })
    console.log(' AA = ', A)
    tempB = _.find(A.child, { id : item.id })
    
    console.log('중분류 = ', tempB)
  }
  else if(item.level == 3)
  {
    // 선택된 소분류 찾기
    let idA = item.id.substr(0, 1)
    let idB = item.pid

    let A = _.find(ArrayList.value, { id : idA })
    let B = _.find(A.child, { id : idB })
    tempC = _.find(B.child, { id : item.id })

    console.log('소분류 = ', tempC)
    
  }  
}

const selectCard = ele => {
  
  sItem.value = ele.id

  // 선택된 아이템의 정보를 넘겨서 내부 id찾기
  selectedItem(ele)

  const docOther = document.getElementsByClassName('selected-card')

  docOther.forEach(item => {
    item.classList.remove('selected-card')
  })

  let cid = ''

  if(ele.level == 1)
  {
    cid = `${'card1_'}${ele.id}`
  }
  else if(ele.level == 2)
  {
    cid = `${'card2_'}${ele.id}`
  }
  else if(ele.level == 3)
  {
    cid = `${'card3_'}${ele.id}`
  }
  
  const doc = document.getElementById(cid)

  doc.classList.add('selected-card')
}

const addItem = name => {

  //console.log('A length = ', ArrayList.value.length)
  //console.log('B length = ', ArrayList.value[0].child.length)
  //console.log('C length = ', ArrayList.value[0].child[0].child.length)
  let d = new Date()

  if(name == 'A') {
    
    let maxId = ((ArrayList.value.reduce((max, obj) => Math.max(max, obj['id']), 0))+1).toString()    
    let maxIdx = ArrayList.value.reduce((max, obj) => Math.max(max, obj['idx']), 0)
    // let NEW_UNIT_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-U' + d.getTime()
    let NEW_UNIT_ID = "HHIS-CW-G2P0-001-01" + '-U' + d.getTime()

    ArrayList.value.push({ level: 1, id: maxId, idx : (maxIdx + 1), text: '' + maxId, child: [],
      UNIT_ID: NEW_UNIT_ID,
      // WORK_STANDARD_ID : WORK_STANDARD_MASTER.WORK_STANDARD_ID,      
      WORK_STANDARD_ID : 'HHIS-CW-G2P0-001-01',
      DATA_STATUS: 'N',
      STATUS: 'C',
      IS_CHECK: 'N',
      IS_SAVE: 'N',
      IS_SELECT: false,
      IS_SUCCESS: ''
    })    

    console.log('why list ~! : ',ArrayList.value)
  }
  else if(name == 'B') {

    if(tempA == null)
    {
      Message.warn('대분류를 선택해주세요')
      
      return
    }

    console.log('tempA.Child = ', tempA.child)
    
    // for(let i = 0; i < ArrayList.value.length; i++){ 
      
    //   let act = ArrayList.value[i].child.filter(act => act.IS_CHECK === 'Y')

    //   if(act.length > 0){
    //     WORK_STANDARD_ACT[k] = ArrayList.value[i].child.filter(act => act.IS_CHECK === 'Y')
    //     k++
    //   }

    //   // for(let j = 0; j < ArrayList.value[i].child.length; j++){ 
        
    //   //   let risk = ArrayList.value[i].child[j].child.filter(act => act.IS_CHECK === 'Y')

    //   //   if(risk.length > 0){
    //   //     WORK_STANDARD_RISK[m] = ArrayList.value[i].child[j].child.filter(risk => risk.IS_CHECK === 'Y')
    //   //     m++
    //   //   }        
        
    //   // }
    // }
    console.log("ArrayList.value : ", ArrayList.value)

    let maxId = tempA.child.reduce((max, obj) => Math.max(max, obj['id'].substr(2)), 0)
    let maxIdx = tempA.child.reduce((max, obj) => Math.max(max, obj['idx']), 0)
    console.log('tempA.id : ',tempA.id)
    console.log('중분류 maxId : ',maxId)
    let newId = tempA.id + '_' + (maxId + 1)
    let NEW_ACT_ID = 'HHIS-CW-G2P0-001-01' + '-A' + d.getTime()
    // let UNIT_ID = ArrayList.value.find(t => t.IS_SELECT === true).UNIT_ID
    let UNIT_ID = ArrayList.value.find(t => t.IS_SELECT === false).UNIT_ID

    console.log("real unit : ", UNIT_ID)
    
    // let NEW_ACT_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-A' + d.getTime()    
    tempA.child.push( { level: 2, id : newId, pid : tempA.id, idx : (maxIdx + 1), text: '' + maxId, child: [], 
      ACT_ID: NEW_ACT_ID,
      // WORK_STANDARD_ID : WORK_STANDARD_MASTER.WORK_STANDARD_ID,      
      WORK_STANDARD_ID : 'HHIS-CW-G2P0-001-01',
      UNIT_ID: UNIT_ID,
      DATA_STATUS: 'N',
      STATUS: 'C',
      IS_SELECT: false,
      IS_CHECK: 'N',
      IS_SAVE: 'N',
      IS_SUCCESS: '' 
    })

  }
  else if(name == 'C') {

    if(tempB == null)
    {
      Message.warn('중분류를 선택해주세요')
      
      return
    }

    let maxId = tempB.child.reduce((max, obj) => Math.max(max, obj['id'].substr(4)), 1)
    let maxIdx = tempB.child.reduce((max, obj) => Math.max(max, obj['idx']), 1)
    let newId = tempB.id + '_' + (maxId + 1)
    let UNIT_ID 
    let ACT_ID

    for(let i = 0; i < ArrayList.value.length; i++){       
      UNIT_ID = ArrayList.value[i].child.find(t => t.IS_SELECT === false).UNIT_ID      
      ACT_ID = ArrayList.value[i].child.find(t => t.IS_SELECT === false).ACT_ID                 
    }
    
    let NEW_RISK_ID = 'HHIS-CW-G2P0-001-01' + '-R' + d.getTime()
// let NEW_RISK_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-R' + d.getTime()

    tempB.child.push( { level: 3, id : newId, pid : tempB.id, idx : (maxIdx + 1), text: '' + maxId,
      RISK_ID: NEW_RISK_ID,
      // WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      WORK_STANDARD_ID: 'HHIS-CW-G2P0-001-01',
      UNIT_ID: UNIT_ID,
      ACT_ID: ACT_ID,
      DATA_STATUS: 'N',
      STATUS: 'C',
      IS_SELECT: false,
      IS_CHECK: 'N',
      IS_SAVE: 'N',
      IS_SUCCESS: '' 
    })
  }
  else if(name == 'D')
    rebuildArray()
}

const dragOptions = {
  animation: 200,
}

const onDragStart = () => {
  //console.log('Drag Start')
}

const onDragEnd = e => {
  // console.log('Drag End', e)


  // const docOther = document.getElementsByClassName('todo-item')
  // const idx = e.newIndex

  // docOther.forEach(item => {
  //   item.classList.remove('selected-draggable')
  // })

  // docOther[idx].classList.add('selected-draggable')

  // 객체 배열의 idx를 1부터 재생성
  sortArray()
  //console.log('eeeeee', e)

  //console.log('old info = ', docOther[e.oldIndex])
  //console.log('new info = ', docOther[e.newIndex])

  //console.log(docOther[idx])

}

const sortArray = () => {
  
  let cntX = 1
  let cntY = 1
  let cntZ = 1

  ArrayList.value.forEach( x => {
    
    cntY = 1
    x.idx = cntX++ 

    x.child.forEach( y => {
      cntZ = 1      
      y.idx = cntY++

      y.child.forEach( z => {
        z.idx = cntZ++
      })
    })
  })

  // for(let i in ArrayList.value)
  // {
  //   console.log('EEEEEEEE', ArrayList.value[i].child)
    
  //   //myArray[0].child.sort((a, b) => a.id - b.id);
  // }


  //ArrayList.value[0].child.value[0].child.sort((a, b) => a.idx - b.idx)

}

// 인덱스에 맞춰 재배열
const rebuildArray = () => {
  ArrayList.value.sort((a, b) => a.idx - b.idx)

  // let unit  = ArrayList.value.filter(act => act.IS_CHECK === 'Y')    
  // let unitB 
  // console.log('king~~~~~~', unit.length)
  // if( unit.length > 0)
  // {
  //   // ArrayList.value = ArrayList.value.filter(act => act.IS_CHECK === 'Y')
  //   // ArrayList.value.sort((a, b) => a.idx - b.idx)   
  //   // unitB = unit.sort((a, b) => a.idx - b.idx)
  //   // console.log('unit jiral : ', unit.sort((a, b) => a.idx - b.idx))
  //   // console.log('unitB sibal : ', unitB)
  //   // ArrayList.value = unit
  //   ArrayList.value.filter(act => act.IS_CHECK === 'Y').sort((a, b) => a.idx - b.idx)    
  //   console.log('sibal! : ', ArrayList.value.filter(act => act.IS_CHECK === 'Y').sort((a, b) => a.idx - b.idx))
  // }

         

  for(let i=0; i<ArrayList.value.length; i++)
  {
    ArrayList.value[i].child.sort((a, b) => a.idx - b.idx)
    
    for(let j=0; j<ArrayList.value[i].child.length; j++)
    {
      ArrayList.value[i].child[j].child.sort((a, b) => a.idx - b.idx)        
    }
    
  }

  
  

  // for(let i=0; i<ArrayList.value.length; i++)
  // {
  //   for(let j=0; j<ArrayList.value[i].child.length; j++)
  //   {
  //      ArrayList.value[i].child[j].child.sort((a, b) => a.idx - b.idx)  
  //   }
  // }
}

const removeTodo = (type) => {
  if(type === 'unit')
  {    
    let UNIT =  ArrayList.value.filter(unit => unit.IS_CHECK === 'Y')   
    for(let i = 0; i < UNIT.length; i++)
    {      
      ArrayList.value = ArrayList.value.filter(list => list.id !== UNIT[i].id)
    }          
  }
  else if(type === 'act')
  {            
    for(let i = 0; i < ArrayList.value.length; i++)
    {
      let ACT =  ArrayList.value[i].child.filter(act => act.IS_CHECK === 'Y')
      console.log('ACT value : ', ACT)
      
      console.log('ACT after value : ', ACT)
      console.log('I VALUE : ',i)


      if(ACT.length > 0)
      {        
        for(let k = 0; k < ACT.length; k++)
        {
          if(ArrayList.value[i].child.length > 0)
          {              
            let list = ArrayList.value[i].child.filter(item => item.id !== ACT[k].id) 
            ArrayList.value[i].child = []              
            ArrayList.value[i].child = list
          }else
          {
            ArrayList.value[i].child = []
          }
          
          console.log('ArrayList.value[i].child[k] : ', ArrayList.value[i].child[k])
        }            
      }
      
    } 
    
  }
  else if(type === 'risk')
  {
    for(let i = 0; i < ArrayList.value.length; i++)
    {
      for(let j = 0; j < ArrayList.value[i].child.length; j++)
      {        
        let RISK =  ArrayList.value[i].child[j].child.filter(risk => risk.IS_CHECK === 'Y')        
        
        if(RISK.length > 0)
        {        
          for(let k = 0; k < RISK.length; k++)
          {
            if(ArrayList.value[i].child[j].child.length > 0)
            {              
              let list = ArrayList.value[i].child[j].child.filter(item => item.id !== RISK[k].id) 
              ArrayList.value[i].child[j].child = []              
              ArrayList.value[i].child[j].child = list
            }else
            {
              ArrayList.value[i].child[j].child = []
            }
            
            console.log('ArrayList.value[i].child[k] : ', ArrayList.value[i].child[k])
          }            
        }
      }  
      
      console.log('risk TEST value : ',ArrayList.value)
      
    } 

  }
  
}

const selectEvent = (type, data) => {
  if (type === 'unit') {
    WORK_STANDARD_UNIT.map(t => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_ACT.map(t => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_RISK.map(t => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })
    WORK_STANDARD_UNIT.find(
      t => t.UNIT_ID === data.UNIT_ID
    ).IS_SELECT = true

    WORK_STANDARD_UNIT.find(t => t.UNIT_ID === data.UNIT_ID).IS_CHECK =
      'Y'

    isUnitRemove = isActAdd = false
  } else if (type === 'act') {
    WORK_STANDARD_UNIT.map(t => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_UNIT.find(
      t => t.UNIT_ID === data.UNIT_ID
    ).IS_SELECT = true

    WORK_STANDARD_UNIT.find(t => t.UNIT_ID === data.UNIT_ID).IS_CHECK =
      'Y'

    WORK_STANDARD_ACT.map(t => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_RISK.map(t => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_ACT.find(
      t => t.ACT_ID === data.ACT_ID
    ).IS_SELECT = true

    WORK_STANDARD_ACT.find(t => t.ACT_ID === data.ACT_ID).IS_CHECK =
      'Y'

    isActRemove = isActSelect = isRiskAdd = false

    if (
      WORK_STANDARD_ACT.find(t => t.ACT_ID === data.ACT_ID).IS_SAVE ===
      'Y'
    ) {
      isActSelect = false
    }

    if (
      WORK_STANDARD_ACT.find(t => t.ACT_ID === data.ACT_ID).IMG_CNT ===
      0
    ) {
      isActSelectColor = 'gray'
    } else {
      isActSelectColor = 'green'
    }
  } else if (type === 'risk') {
    WORK_STANDARD_UNIT.map(t => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_ACT.map(t => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_UNIT.find(
      t =>
        t.UNIT_ID ===
        WORK_STANDARD_ACT.find(x => x.ACT_ID === data.ACT_ID).UNIT_ID
    ).IS_SELECT = true

    WORK_STANDARD_UNIT.find(
      t =>
        t.UNIT_ID ===
        WORK_STANDARD_ACT.find(x => x.ACT_ID === data.ACT_ID).UNIT_ID
    ).IS_CHECK = 'Y'

    WORK_STANDARD_ACT.find(
      t => t.ACT_ID === data.ACT_ID
    ).IS_SELECT = true

    WORK_STANDARD_ACT.find(t => t.ACT_ID === data.ACT_ID).IS_CHECK ='Y'

    WORK_STANDARD_RISK.map(t => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_RISK.find(
      t => t.RISK_ID === data.RISK_ID
    ).IS_SELECT = true

    WORK_STANDARD_RISK.find(t => t.RISK_ID === data.RISK_ID).IS_CHECK = 'Y'

    isRiskRemove = false
  }


}



// 단위작업 조회
const searchUnit = () => {
  // WORK_STANDARD_MASTER
  let test_id = 'HHIS-CW-C460-006-02'
  commonSearchApi({ queryId: "RSKBA0010_SEARCH_05", param: { WORK_STANDARD_ID : test_id }  }).then( res => {    
    let maxId 
    let maxIdx 
    // WORK_STANDARD_UNIT = res.ORESULT_CUR 
    for(let i=0; i < res.ORESULT_CUR.length; i++){
      maxId = (ArrayList.value.length + 1).toString()
      maxIdx = ArrayList.value.reduce((max, obj) => Math.max(max, obj['idx']), 0)
      ArrayList.value.push({ level: 1, id: maxId, text: '' + maxId, child: [], 
        UNIT_ID : res.ORESULT_CUR[i].UNIT_ID, 
        UNIT_NM : res.ORESULT_CUR[i].UNIT_NM,
        TRANS_UNIT_NM : res.ORESULT_CUR[i].TRANS_UNIT_NM,
        UNIT_SORT : res.ORESULT_CUR[i].UNIT_SORT,
        DATA_STATUS : res.ORESULT_CUR[i].DATA_STATUS,
        ORA_YN : res.ORESULT_CUR[i].ORA_YN,
        STATUS : res.ORESULT_CUR[i].STATUS,
        IS_SAVE : res.ORESULT_CUR[i].IS_SAVE,
        IS_SELECT : res.ORESULT_CUR[i].IS_SELECT, 
        IS_CHECK : res.ORESULT_CUR[i].IS_CHECK, 
      })         
    }
    searchAct()
  })

}

// 작업행동 조회
const searchAct = () => {
  // WORK_STANDARD_MASTER
  let test_id = 'HHIS-CW-C460-006-02'
  commonSearchApi({ queryId: "RSKBA0010_SEARCH_06", param: { WORK_STANDARD_ID : test_id }  }).then( res => {    
    
    let maxId 
    let maxIdx 
    let newId
    // WORK_STANDARD_ACT = res.ORESULT_CUR

    for(let i=0; i < res.ORESULT_CUR.length; i++){
      tempA = _.find(ArrayList.value, { UNIT_ID: res.ORESULT_CUR[i].UNIT_ID })      
      maxId = tempA.child.reduce((max, obj) => Math.max(max, obj['id'].substr(2)), 0)            
      maxIdx = tempA.child.reduce((max, obj) => Math.max(max, obj['idx']), 0)
      newId = tempA.id + '_' + (maxId + 1)
      
      tempA.child.push( { level: 2, id : newId, pid : tempA.id, idx : (maxIdx + 1), text: '' + maxId, child: []
        , UNIT_ID : res.ORESULT_CUR[i].UNIT_ID 
        , ACT_ID : res.ORESULT_CUR[i].ACT_ID
        , ACT_NM : res.ORESULT_CUR[i].ACT_NM 
        , CHK_NM : res.ORESULT_CUR[i].CHK_NM  
        , TRANS_ACT_NM : res.ORESULT_CUR[i].TRANS_ACT_NM  
        , TRANS_CHK_NM : res.ORESULT_CUR[i].TRANS_CHK_NM  
        , ACT_SORT : res.ORESULT_CUR[i].ACT_SORT  
        , DATA_STATUS : res.ORESULT_CUR[i].DATA_STATUS  
        , ACT_KEYWORD : res.ORESULT_CUR[i].ACT_KEYWORD  
        , CHK_KEYWORD : res.ORESULT_CUR[i].CHK_KEYWORD  
        , STATUS : res.ORESULT_CUR[i].STATUS  
        , IS_SAVE : res.ORESULT_CUR[i].IS_SAVE  
        , IS_SELECT : res.ORESULT_CUR[i].IS_SELECT  
        , IS_CHECK : res.ORESULT_CUR[i].IS_CHECK  
      })      
    }
    searchRisk(res)
  })

}

// 위험요인 조회
const searchRisk = data => {
  // WORK_STANDARD_MASTER
  let test_id = 'HHIS-CW-C460-006-02'
  commonSearchApi({ queryId: "RSKBA0010_SEARCH_07", param: { WORK_STANDARD_ID : test_id }  }).then( res => {    
    // 선택된 소분류 찾기
    let maxId 
    let maxIdx 
    let newId 
    let A 
    WORK_STANDARD_RISK = res.ORESULT_CUR

    for(let i=0; i < res.ORESULT_CUR.length; i++){
      
      let getUnit = _.find(data.ORESULT_CUR, { ACT_ID : res.ORESULT_CUR[i].ACT_ID })
      A = _.find(ArrayList.value, { UNIT_ID : getUnit.UNIT_ID })      
      tempB = _.find(A.child, { ACT_ID : res.ORESULT_CUR[i].ACT_ID })

      console.log('tempB : ', tempB)
      
      maxId = tempB.child.reduce((max, obj) => Math.max(max, obj['id'].substr(4)), 1)
      maxIdx = tempB.child.reduce((max, obj) => Math.max(max, obj['idx']), 1)
      newId = tempB.id + '_' + (maxId + 1)

      tempB.child.push( { level: 3, id : newId, pid : tempB.id, idx : (maxIdx + 1), text: '' + maxId
        , ACT_ID : res.ORESULT_CUR[i].ACT_ID
        , RISK_ID : res.ORESULT_CUR[i].RISK_ID
        , RISK_CD : res.ORESULT_CUR[i].RISK_CD
        , RISK_CD_P_NM : res.ORESULT_CUR[i].RISK_CD_P_NM
        , RISK_CD_D_NM : res.ORESULT_CUR[i].RISK_CD_D_NM 
        , RISK_NM : res.ORESULT_CUR[i].RISK_NM 
        , RM_CD : res.ORESULT_CUR[i].RM_CD
        , RM_CD_P_NM : res.ORESULT_CUR[i].RM_CD_P_NM
        , RM_CD_D_NM : res.ORESULT_CUR[i].RM_CD_D_NM     
        , RM_NM : res.ORESULT_CUR[i].RM_NM       
        , BEFOR_FRE : res.ORESULT_CUR[i].BEFOR_FRE       // 빈도
        , BEFOR_MAT : res.ORESULT_CUR[i].BEFOR_MAT       // 강도      
        , BEFOR_TOTAL : res.ORESULT_CUR[i].BEFOR_TOTAL       
        , AFTER_FRE : res.ORESULT_CUR[i].AFTER_FRE       
        , AFTER_MAT : res.ORESULT_CUR[i].AFTER_MAT       
        , RISK_SORT : res.ORESULT_CUR[i].RISK_SORT       
        , RISK_DATA_STATUS : res.ORESULT_CUR[i].RISK_DATA_STATUS       
        , RM_DATA_STATUS : res.ORESULT_CUR[i].RM_DATA_STATUS       
        , STATUS : res.ORESULT_CUR[i].STATUS       
        , IS_SAVE : res.ORESULT_CUR[i].IS_SAVE    
        , IS_SELECT : res.ORESULT_CUR[i].IS_SELECT     
        , IS_CHECK : res.ORESULT_CUR[i].IS_CHECK        
      })
    }  
    

  })

}

// 세부내용 저장 
const unitSaveData = () => {  
  // let test_id = 'HHIS-CW-C460-006-02'
  let test_id = 'HHIS-CW-G2P0-001-01'
  
  commonSearchApi({ queryId: "RSKBA0010_SEARCH_05", param: { WORK_STANDARD_ID : test_id }  }).then( res => {    
    console.log('unit array : ', ArrayList.value)
    // sort값 재정렬
    // rebuildArray()

    let UNIT = reactive([])
    let ACT = reactive([])
    let RISK = reactive([])

    WORK_STANDARD_UNIT = []
    WORK_STANDARD_ACT = []
    WORK_STANDARD_RISK = []

    let UNIT_SORT = 1
    
    
    
    // 대분류 체크한 값 
    UNIT = ArrayList.value.filter(unit => unit.IS_CHECK === 'Y')
    
    UNIT.forEach(item => {
      WORK_STANDARD_UNIT.push({
        DATA_STATUS : item.DATA_STATUS,      
        IS_CHECK : item.IS_CHECK,    
        IS_SAVE : item.IS_SAVE,    
        IS_SELECT : item.IS_SELECT,       
        IS_SUCCESS : item.IS_SUCCESS,              
        STATUS : item.STATUS,      
        UNIT_NM : item.UNIT_NM,              
        UNIT_ID : item.UNIT_ID,
        ORA_YN: item.ORA_YN,  
        WORK_STANDARD_ID : item.WORK_STANDARD_ID,   
        UNIT_SORT : UNIT_SORT,             
      })
      UNIT_SORT += 1
    })
    console.log('sort WORK_STANDARD_UNIT : ', WORK_STANDARD_UNIT)
    for(let i = 0; i < ArrayList.value.length; i++){ 
      let ACT_SORT = 1
      let act = ArrayList.value[i].child.filter(act => act.IS_CHECK === 'Y')
    
      if(act.length > 0){              
        //중분류
        ACT =  ArrayList.value[i].child.filter(act => act.IS_CHECK === 'Y')  
        console.log('ACT1.value : ',ACT)      
        ACT.forEach(item => {
          WORK_STANDARD_ACT.push({
            ACT_ID : item.ACT_ID,  
            DATA_STATUS : item.DATA_STATUS,      
            IS_CHECK : item.IS_CHECK,    
            IS_SAVE : item.IS_SAVE,    
            IS_SELECT : item.IS_SELECT,       
            IS_SUCCESS : item.IS_SUCCESS,              
            STATUS : item.STATUS,      
            ACT_NM : item.ACT_NM,          
            CHK_NM : item.CHK_NM,          
            UNIT_ID : item.UNIT_ID,  
            WORK_STANDARD_ID : item.WORK_STANDARD_ID,   
            ACT_SORT : ACT_SORT,             
          })
          ACT_SORT += 1
        })
      }
      
      for(let j = 0; j < ArrayList.value[i].child.length; j++){ 
        let RISK_SORT = 1
        let risk = ArrayList.value[i].child[j].child.filter(act => act.IS_CHECK === 'Y')

        if(risk.length > 0){
          //소분류
          RISK = ArrayList.value[i].child[j].child.filter(risk => risk.IS_CHECK === 'Y')
          RISK.forEach(item => {
            WORK_STANDARD_RISK.push({
              ACT_ID : item.ACT_ID,  
              DATA_STATUS : item.DATA_STATUS,      
              IS_CHECK : item.IS_CHECK,    
              IS_SAVE : item.IS_SAVE,    
              IS_SELECT : item.IS_SELECT,       
              IS_SUCCESS : item.IS_SUCCESS,
              RISK_ID : item.RISK_ID,              
              STATUS : item.STATUS,          
              RISK_NM : item.RISK_NM,
              RISK_CD : item.RISK_CD,
              RM_NM : item.RM_NM,
              RM_CD : item.RM_CD,
              BEFOR_FRE : item.BEFOR_FRE,
              BEFOR_MAT : item.BEFOR_MAT,
              UNIT_ID : item.UNIT_ID,  
              WORK_STANDARD_ID : item.WORK_STANDARD_ID,            
              RISK_SORT : RISK_SORT,            
            })
            RISK_SORT += 1
          })
        }                  
      }
      
    }

    console.log('sort WORK_STANDARD_ACT : ', WORK_STANDARD_ACT)
    console.log('sort WORK_STANDARD_RISK : ', WORK_STANDARD_RISK)

    WORK_STANDARD_UNIT = WORK_STANDARD_UNIT.map(item => {
        const newItem = { ...item };
        if (newItem.hasOwnProperty('child')) {
            delete newItem.child;
        }
        // console.log("WORK_STANDARD_UNIT newItem: ", newItem);
        return newItem;
    });    

    saveParam.UNIT = WORK_STANDARD_UNIT
    saveParam.ACT = WORK_STANDARD_ACT
    saveParam.RISK = WORK_STANDARD_RISK

    // console.log('save Array', ArrayList.value)
    // setTrans()

  })

}

const setTrans = res => {
  
  return commonRskSaveApi({
    queryId: "RSKBA0010_SAVE_02",
    WORK_STANDARD_ID : "HHIS-CW-G2P0-001-01",
    DEPT_CD: codeList.deptCd,
    USR_ID: codeList.userId,
    unitList: WORK_STANDARD_UNIT,
    actList: WORK_STANDARD_ACT,
    riskList: WORK_STANDARD_RISK,
  })
}

const openPopup2 = (gbn, id) => {    
  
  partsArray = id.split('_') 
  
  if (gbn === '위험요인') {               
    rSKBA0010popup2.value.openPopup()    
  } else if (gbn === '감소대책') {
    rSKBA0010popup3.value.openPopup()    
  }  

}

// 위험요인
const OnSelectedFactors = row =>{  
  if(row){    
    const A = partsArray[0];
    const B = partsArray[1]; 
    const C = partsArray[2]; 
    
    if (row.PARENT_ID === 'RISK_CD-01') {
      ArrayList.value[A-1].child[B-1].child[C-2].RISK_CD_P_NM = '사고'  
    } else if (row.PARENT_ID === 'RISK_CD-02') {
      ArrayList.value[A-1].child[B-1].child[C-2].RISK_CD_P_NM = '비사고'
    }

    ArrayList.value[A-1].child[B-1].child[C-2].RISK_CD_D_NM = row.SYS_CDNM    
    ArrayList.value[A-1].child[B-1].child[C-2].RISK_CD = row.CODE_ID
  }
}

// 감소대책
const OnSelectedReduction = row =>{  
  if(row){
    const A = partsArray[0];
    const B = partsArray[1]; 
    const C = partsArray[2]; 
    
    ArrayList.value[A-1].child[B-1].child[C-2].RM_CD_P_NM = row.PARENT_CODE_NM
    ArrayList.value[A-1].child[B-1].child[C-2].RM_CD_D_NM = row.CODE_NM
    ArrayList.value[A-1].child[B-1].child[C-2].RM_CD = row.CODE_ID
  }
}




</script>

<template>
  <div>
    <v-btn @click="addItem('A')">대분류 추가</v-btn>
    <v-btn @click="addItem('B')">중분류 추가</v-btn>
    <v-btn @click="addItem('C')">소분류 추가</v-btn>
    <!-- <v-btn @click="addItem('D')">재정렬</v-btn> -->
    <v-btn @click="searchUnit()">조회</v-btn>
    <v-btn @click="unitSaveData()">저장</v-btn>    
    <v-text-field v-model="sItem"></v-text-field>
  </div>
  <div>
    <v-btn @click="removeTodo('unit')">대분류제거</v-btn>    
    <v-btn @click="removeTodo('act')">중분류제거</v-btn>    
    <v-btn @click="removeTodo('risk')">소분류제거</v-btn>    
  </div>
  <div>        
    <!-- 대분류 -->
    <draggable v-model="ArrayList" :options="dragOptions" @start="onDragStart" @end="onDragEnd" item-key="id" >
      <template #item="{ element }">
        <div :id="'row1_' + element.id" class="todo-item" 
          @mousedown="selectRow(element)">
          <VRow style="margin:10px;">
            <VCol cols="2">
              <!-- <VCard :id="'card1_' + element.id" class="todo-card" @mousedown="selectCard(element)" height="100%">  -->
                <VCard :id="'card1_' + element.id" class="todo-card" @mousedown="selectCard(element)" height="100%"> 
                <!-- 여기 밑에 대분류 컴포넌트-->
                <VCol cols="12" md="2" align-self="center">                  
                    <VCheckbox true-value="Y" false-value="N" v-model="element.IS_CHECK"  />
                </VCol>
                <VCol cols="12" md="10" align-self="center">
                  <!-- <VTextarea auto-grow auto-height rows="4" v-model="element.UNIT_NM" @click="selectEvent('unit', element)" variant="underlined" 
                  hide-details /> -->

                  <VTextarea auto-grow auto-height rows="4" v-model="element.UNIT_NM" variant="underlined" 
                  hide-details />
                </VCol>
              </VCard>
            </VCol>
            <VCol cols="10">
              <!-- 중분류 -->
              <draggable v-model="element.child" :options="dragOptions" @start="onDragStart" @end="onDragEnd" item-key="id">
                <template #item="{ element }"> 
                  <VRow>
                    <VCol cols="3">
                      <VCard :id="'card2_' + element.id" class="todo-card" @mousedown="selectCard(element)" height="100%">
                        <!-- 여기 밑에 중분류 컴포넌트-->
                        <VCol cols="12" md="12" class="py-0 pt-2">
                          <VCheckbox label="작업행동" true-value="Y" false-value="N" v-model="element.IS_CHECK"  />
                        </VCol>
                        <VCol cols="12" md="12" class="py-1">
                          <VTextField 
                            label="작업순서, 세부동작 등 기술"
                            v-model="element.ACT_NM"
                            variant="underlined"
                          />
                        </VCol>
                        <VCol cols="12" md="12" class="pt-0">
                          <VTextField 
                            label="체크정보"
                            v-model="element.CHK_NM"
                            variant="underlined"
                          />
                        </VCol>
                      </VCard>
                    </VCol>
                    <VCol cols="9">
                      <!-- 소분류 -->
                      <draggable v-model="element.child" :options="dragOptions" @start="onDragStart" @end="onDragEnd" item-key="id">
                        <template #item="{ element }"> 
                          <VRow>
                            <VCol>
                              <VCard :id="'card3_' + element.id" class="todo-card" @mousedown="selectCard(element)" height="100%">
                                <!-- 여기 밑에 소분류 컴포넌트-->
                                <!-- {{ element.text }} -->
                                <VRow>
                                  <VCol cols="12" md="4">
                                    <VRow>
                                      <VCol cols="12" md="12" class="py-0 pt-2">
                                        <VCheckbox true-value="Y" false-value="N" v-model="element.IS_CHECK" />
                                      </VCol>  
                                      <VCol cols="12" md="6" class="py-1">
                                        <VTextField 
                                          label="분류"
                                          v-model="element.RISK_CD_P_NM"
                                          variant="underlined"
                                          append-inner-icon="mdi-magnify" 
                                          @keydown.enter="e => {
                                            openPopup2('위험요인')
                                          }"
                                          :readOnly="textReadOnly"
                                          @click:appendInner="openPopup2('위험요인',element.id)"
                                        />                                                                  
                                      </VCol> 
                                      <VCol cols="12" md="6" class="py-1">
                                        <VTextField 
                                          v-model="element.RISK_CD_D_NM" 
                                          :readOnly="textReadOnly" 
                                          variant="underlined" 
                                        />
                                      </VCol>
                                      <VCol cols="12" md="12" class="py-1">
                                        <VTextField 
                                          v-model="element.RISK_NM" 
                                          variant="underlined" 
                                          label="위험요인 상세내용"
                                        />                                
                                      </VCol> 
                                    </VRow>
                                  </VCol>
                                  <VCol cols="12" md="4">
                                    <VRow>
                                      <VCol cols="12" md="6" class="py-1 ">                                                              
                                        <ILabel                            title=""                                 
                                          label-width="0"
                                        >
                                          <template #editor="editorProps">
                                            <VAutocomplete
                                              v-model="element.BEFOR_FRE"
                                              :items="codeList.BEFOR_TYPE"
                                              item-title="TXT"
                                              item-value="COD"
                                            />
                                          </template>
                                        </ILabel>                                    
                                      </VCol>   
                                      <VCol cols="12" md="6" class="py-1">
                                        <ILabel
                                        :label="$t('구분')"
                                        label-loc="top"
                                        label-width="125"
                                        >
                                          <template #editor="editorProps">
                                            <VAutocomplete
                                              v-model="element.BEFOR_MAT"
                                              :items="codeList.BEFOR_TYPE"
                                              item-title="TXT"
                                              item-value="COD"
                                            />
                                          </template>
                                        </ILabel>                                 
                                      </VCol> 
                                    </VRow>
                                  </VCol>  
                                  <VCol cols="12" md="4">
                                    <VRow>
                                      <VCol cols="12" md="12" class="py-0 pt-2">
                                      </VCol>
                                      <VCol cols="12" md="6" class="py-1">
                                        <VTextField 
                                          label="분류"
                                          v-model="element.RM_CD_P_NM"
                                          variant="underlined"
                                          append-inner-icon="mdi-magnify" 
                                          @keydown.enter="e => {
                                            openPopup2('감소대책')
                                          }"
                                          :readOnly="textReadOnly"
                                          @click:appendInner="openPopup2('감소대책',element.id)"
                                        />                                                                  
                                      </VCol>
                                      <VCol cols="12" md="6" class="py-1">
                                        <VTextField 
                                          v-model="element.RM_CD_D_NM" 
                                          :readOnly="textReadOnly" 
                                          variant="underlined" 
                                        />                                
                                      </VCol>
                                      <VCol cols="12" md="12">
                                        <VTextField 
                                          label="감소대책 상세내용"
                                          v-model="element.RM_NM"
                                          variant="underlined"
                                        />
                                      </VCol>
                                    </VRow>
                                  </VCol>
                                </VRow>  

                              </VCard>
                            </VCol>
                          </VRow>
                        </template>
                      </draggable>
                    </VCol>
                  </VRow>
                </template>            
              </draggable>
            </VCol>
          </VRow>
        </div>
      </template>
    </draggable>  
  </div>  
</template> 

<style scoped>
/* .todo-item {
  border: 2px solid #ccc;
  padding: 10px;
  margin-bottom: 5px;
  cursor: grab;
  display: flex;  
} */

.todo-item {
  border-top: 2px solid #ccc;
  padding: 10px;
  margin-bottom: 5px;
  cursor: grab;
  display: flex;  
}

.todo-card {  
}

.todo-item button {
  cursor: pointer;
}

/* .selected-draggable {
  background-color: #E9EDF9;
}

.selected-card {
  background-color: lightgray;
} */
</style>
