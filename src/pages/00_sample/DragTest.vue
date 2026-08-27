<script setup>
import { reactive, computed, ref } from 'vue'
import Message from "@hiway/utils/notify"
import draggable from 'vuedraggable'
import _ from 'lodash'

const isFlag = ref(true)
const sItem = ref(null)

const s1 = ref(null)
const s2 = ref(null)
const s3 = ref(null)

//const ArrayList = ref([])

const ArrayList = ref([
  { level: 1, id:'1', pid:0, idx:2, text:'AAAA', child: [{ level: 2, id:'1_1', pid:'1', idx:2, text:'중분류 - 테스트1', child: [{ level: 3, id:'1_1_1', pid: '1_1', idx:3, text: '소분류 - 테스트1' }, { level: 3, id:'1_1_2', pid: '1_1', idx:2, text: '소분류 - 테스트2' }, { level: 3, id:'1_1_3', pid:'1_1', idx: 1, text: '소분류 - 테스트3' }] },
                                                         { level: 2, id:'1_2', pid:'1', idx:1, text:'중분류 - 테스트2', child: [] }] },
  { level: 1, id:'2', pid:0, idx:1, text:'BBBB', child: [{ level: 2, id:'2_1', pid:'2', idx:1, text:'중분류 - 레벨2 아이템1', child: [] }, 
                                                         { level: 2, id:'2_2', pid:'2', idx:2, text:'중분류 - 레벨2 아이템2 ----', child: [] }] },
])

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
    let A = _.find(ArrayList.value, { id : idA })
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
  
  if(name == 'A') {
    
    let maxId = (ArrayList.value.length + 1).toString()
    let maxIdx = ArrayList.value.reduce((max, obj) => Math.max(max, obj['idx']), 0)

    ArrayList.value.push({ level: 1, id: maxId, text: '' + maxId, child: [] })    
  }
  else if(name == 'B') {

    if(tempA == null)
    {
      Message.warn('대분류를 선택해주세요')
      
      return
    }

    console.log('tempA.Child = ', tempA.child)

    let maxId = tempA.child.reduce((max, obj) => Math.max(max, obj['id'].substr(2)), 0)
    let maxIdx = tempA.child.reduce((max, obj) => Math.max(max, obj['idx']), 0)
    let newId = tempA.id + '_' + (maxId + 1)

    console.log('maxId', maxId)
    console.log('maxIdx', maxIdx)
    console.log('newId', newId)
    
    //tempA.push( { id : newId, pid : tempA.id, idx : (maxIdx + 1), child: [] })
    tempA.child.push( { level: 2, id : newId, pid : tempA.id, idx : (maxIdx + 1), text: '' + maxId, child: [] })
  }
  else if(name == 'C') {

    if(tempB == null)
    {
      Message.warn('중분류를 선택해주세요')
      
      return
    }
    
    console.log('tempB =', tempB)

    let maxId = tempB.child.reduce((max, obj) => Math.max(max, obj['id'].substr(4)), 1)

    console.log('matId =', maxId)

    let maxIdx = tempB.child.reduce((max, obj) => Math.max(max, obj['idx']), 1)
    let newId = tempB.id + '_' + (maxId + 1)

    console.log('newId =', newId)
    console.log('max IDX =', maxIdx)

    tempB.child.push( { level: 3, id : newId, pid : tempB.id, idx : (maxIdx + 1), text: '' + maxId, child: [] })
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

const removeTodo = (id) => {
  todos.value = todos.value.filter(todo => todo.id !== id)
}
</script>

<template>
  <div>
    <v-btn @click="addItem('A')">대분류 추가</v-btn>
    <v-btn @click="addItem('B')">중분류 추가</v-btn>
    <v-btn @click="addItem('C')">소분류 추가</v-btn>
    <v-btn @click="addItem('D')">재정렬</v-btn>
    <v-text-field v-model="sItem"></v-text-field>
  </div>
  <div>        
    <!-- 대분류 -->
    <draggable v-model="ArrayList" :options="dragOptions" @start="onDragStart" @end="onDragEnd" item-key="id">
      <template #item="{ element }">
        <VRow :id="'row1_' + element.id" class="todo-item" @mousedown="selectRow(element)">
          <VCol cols="2">
            <VCard :id="'card1_' + element.id" class="todo-card" @mousedown="selectCard(element)" height="100%"> 
              <!-- 여기 밑에 대분류 컴포넌트-->
              {{ element.text }}
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
                      {{ element.text }}
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
                              {{ element.text }}
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
