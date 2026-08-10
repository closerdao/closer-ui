// Fix incomplete JSX namespace in react module created by @reown/appkit.
// @reown/appkit augments react's JSX namespace with only IntrinsicElements,
// but omits the other interfaces that TypeScript needs for full JSX support
// (children mapping, key prop, ref handling, etc.).
export {};

declare module 'react' {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
    interface IntrinsicAttributes extends React.Attributes {}
    interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> {}
  }
}
