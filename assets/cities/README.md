# 도시 랜드마크 이미지 폴더

이 폴더에 이미지를 넣으면 월드 아틀라스와 도시 카드에 자동으로 표시됩니다.
이미지가 **없어도 오류가 발생하지 않으며**, 국기 · 도시 대표 색상 · 랜드마크 아이콘 · 도시명으로 구성된
대체 카드가 자동으로 표시됩니다.

표시 우선순위는 **로컬 파일 → 외부 URL → 대체 카드**입니다.
개별 이미지가 실패하면 조용히 빼고 나머지를 보여 주며, 전부 실패하면 대체 카드로 떨어집니다.

## 파일 이름 규칙

```
assets/cities/<도시 id>.jpg
```

예) `assets/cities/seoul.jpg`, `assets/cities/paris.jpg`, `assets/cities/capetown.jpg`

도시 데이터에 `images` 배열을 넣으면 갤러리(1~4장)로 펼쳐집니다.

```js
images: [
  { src: "assets/cities/seoul.jpg", caption: "경복궁 근정전", credit: "직접 촬영" },
  { src: "https://upload.wikimedia.org/…/Seoul.jpg", caption: "한강과 도심", credit: "Wikimedia Commons, CC BY-SA 4.0" }
]
```

`credit`(출처)는 상세 패널에 표시됩니다. 위키미디어 공용 등 CC 자료를 우선하세요.
교사 설정에서 **외부 이미지 불러오기**를 끄면 외부 URL은 건너뛰고 로컬 파일과 대체 카드만 사용합니다.

## 권장 사양

- 형식: `.jpg`
- 비율: 가로 : 세로 = 16 : 8 (예: 1200 × 600 px)
- 용량: 파일당 300KB 이하 권장 (수업용 태블릿에서 빠르게 로딩)
- 저작권: 반드시 수업에서 사용할 수 있는 이미지(직접 촬영, 공공누리, CC0 등)를 사용하세요.

## 도시 id 목록 (48개)

### 동아시아·동남아시아
`seoul` `tokyo` `beijing` `shanghai` `singapore` `bangkok` `hanoi` `jakarta`

### 남아시아·서아시아
`delhi` `mumbai` `dubai` `istanbul` `tehran` `doha` `dhaka` `karachi`

### 유럽
`london` `paris` `rome` `barcelona` `berlin` `amsterdam` `prague` `athens`

### 아프리카
`cairo` `capetown` `nairobi` `marrakesh` `lagos` `addis` `accra` `dar`

### 북아메리카
`newyork` `vancouver` `mexico` `sanfrancisco` `toronto` `chicago` `havana` `panama`

### 남아메리카·오세아니아
`rio` `lima` `sydney` `auckland` `buenosaires` `santiago` `bogota` `melbourne`

> 일부 도시만 이미지를 넣어도 됩니다. 이미지가 있는 도시는 사진 카드로,
> 없는 도시는 대체 카드로 각각 표시됩니다.
> 보드에 자주 오르는 도시와 필수 24개부터 채우는 것을 권합니다.
