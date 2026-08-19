# Core Mechanic Architecture Map

아래 화살표는 파일 배치가 아니라 한 번의 핵심 사건이 실제로 이동하는 순서입니다. 대괄호를 프로젝트의 실제 이름으로 바꿉니다.

```text
[Player input or trigger]
  -> [GameObject and Component receiving the event]
  -> [Method checking the condition]
  -> [Script owning the changed state]
  -> [Changed field and value]
  -> [Visual and audio feedback]
  -> [Acceptance test]
```

## Scene

- Scene name:
- Why this Scene owns one complete run:
- Start object:
- Result and restart object:

## Prefab

- Prefab Asset name:
- Instance name in the Scene:
- Reused components:
- Intentional overrides:
- Unexpected overrides checked:

## Script responsibility

| Actual Script | Owned state | Entry event | Condition | State change | Feedback call |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## Inspector references

| Owner Component | Serialized field | Connected object or asset | Failure when missing |
| --- | --- | --- | --- |
|  |  |  |  |
|  |  |  |  |

## Proof

- Normal test:
- Boundary test:
- Reject test:
- Regression test:
- Build evidence:
