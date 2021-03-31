

export const BotContext = createContext();

/* BiomebotBase */

const initialState={
  state: {

  },

};

export default function BiomebotBase(props){
  return(
    <BotContext.Provider
    >
      {props.children}
    </BotContext.Provider>
  )
}