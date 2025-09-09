import BlockItem from './BlockItem';

export default function BlockList() {
  return (
    <>
      <div className="flex justify-between">
        <div className="bg-primary-blue-100 w-[23%] rounded-2xl p-5">
          <h2 className="mb-4 text-lg font-bold">기안 문서</h2>
          <BlockItem></BlockItem>
        </div>
        <div className="w-[23%] rounded-2xl border p-5">
          <h2 className="mb-4 text-lg font-bold">수신 문서</h2>
          <BlockItem></BlockItem>
        </div>
        <div className="bg-primary-blue-100 w-[23%] rounded-2xl p-5">
          <h2 className="mb-4 text-lg font-bold">기안 문서</h2>
          <BlockItem></BlockItem>
        </div>
        <div className="w-[23%] rounded-2xl border p-5">
          <h2 className="mb-4 text-lg font-bold">수신 문서</h2>
          <BlockItem></BlockItem>
        </div>
      </div>
    </>
  );
}
